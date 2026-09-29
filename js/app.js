/**
 * Man Power — split module (P3). Loaded after app-core.js in global scope.
 * Do not use ES modules here — functions share window globals with app-core.
 */
// MODULE: training / init / todo / PWA / AI (entry remainder)
// ══════════════════════════════════════════════
// Man Power TRAINING HUB — SOP + WI DATA
// ══════════════════════════════════════════════
const MET_TRAIN_DATA = [

  // ─── SOPs ───────────────────────────────────
  { id:'SOP-01', type:'sop', color:'#8b5cf6', icon:'🔄', title:'Metallizer Flow Chart',
    scope:'Full process flow — Primary Slitter se SAP entry tak',
    tags:['Process','Met-1','Met-2'], safetyTag:false, sapTag:false, qualityTag:false,
    points:[
      {n:'Flow', t:'Primary Slitter → <b>Conveyor PC-19–23</b> → Met Floor → Loading'},
      {n:'Vacuum', t:'Loading → Vacuum → Production Run → Vent → Unload'},
      {n:'QC', t:'Unload → <b>Quality Check</b> → SAP Entry → Dispatch'}
    ]},

  { id:'SOP-02', type:'sop', color:'#8b5cf6', icon:'🏋️', title:'Jumbo Roll Movement',
    scope:'Conveyor PC-19–23 pe roll safely move karna',
    tags:['Process','Safety','Crane'], safetyTag:true,
    points:[
      {n:'Core', t:'Roll dono ends pe <b>Core Plug</b> lagana mandatory'},
      {n:'Weight', t:'Weight >5MT → <b>Crane + Sling Belt</b> use karo'},
      {n:'Pack', t:'Roll ends pe <b>Foam Sheet</b> protect karo'}
    ]},

  { id:'SOP-03', type:'sop', color:'#8b5cf6', icon:'⚙️', title:'Standard Operating Parameters',
    scope:'Met-1 (BOBST K5 3300mm) & Met-2 (BOBST K5 3650mm)',
    tags:['Process','Parameters','Quality'], qualityTag:true,
    points:[
      {n:'Drum', t:'Drum Temperature: <b>-2°C</b> (PET standard)'},
      {n:'Gas', t:'Gas Wedge: <b>1.5–2 L/Min</b>'},
      {n:'OD', t:'G361/G901 tension tables — machine-specific. Check SOP.'}
    ],
    alert:{color:'rgba(139,92,246,.15)',border:'#8b5cf6',text:'Met-1 & Met-2 ke alag-alag parameters hain — SOP-03 se verify karo'}},

  { id:'SOP-04', type:'sop', color:'#8b5cf6', icon:'🔬', title:'Alubond Metallization',
    scope:'G301 ABM material — specialty metallization',
    tags:['Process','Specialty','Alubond'], qualityTag:true,
    points:[
      {n:'Speed', t:'Speed: <b>650/750 M/Min</b> | Plasma: <b>5kW / 1000 SCCM</b>'},
      {n:'O₂', t:'Oxygen: <b>80%</b> flow'},
      {n:'Critical', t:'Surface Energy: <b>>54 Dynes</b> — mandatory check before start'}
    ],
    alert:{color:'rgba(239,68,68,.1)',border:'#ef4444',text:'⚠️ Surface Energy <54 Dynes = Production रोको — material reject होगा'}},

  { id:'SOP-05', type:'sop', color:'#8b5cf6', icon:'🌡️', title:'Met CPP Parameters',
    scope:'CPP film metallization — special cold drum',
    tags:['Process','CPP','Special'], qualityTag:true,
    points:[
      {n:'Drum', t:'Drum Temp: <b>-20°C</b> (vs PET -2°C — much colder!)'},
      {n:'Speed', t:'Speed: <b>660 M/Min</b> | Rewinder Tension: <b>120–150 N</b>'},
      {n:'Direction', t:'Winding Direction: <b>OUT</b> | Width: 2090mm | Length: 14500m'}
    ],
    alert:{color:'rgba(56,189,248,.1)',border:'#38bdf8',text:'CPP ke liye drum -20°C — PET se alag hai! Galti mat karo'}},

  { id:'SOP-06', type:'sop', color:'#8b5cf6', icon:'📊', title:'OD Set Parameters',
    scope:'Customer-wise OD setpoints — Hawkeye vs actual',
    tags:['Quality','OD','Critical Customer'], qualityTag:true,
    points:[
      {n:'2.2', t:'Customer 2.2 → Hawkeye <b>2.2</b> (Jayesh/KFlex/Prabhat Pipe/Prakash Pipe → <b>2.4</b>)'},
      {n:'2.5', t:'Customer 2.5 → Hawkeye <b>2.5</b> (Special customers → <b>2.7</b>)'},
      {n:'2.8', t:'Customer 2.8 → Hawkeye <b>2.8</b> (Special customers → <b>3.0</b>)'},
      {n:'Waste', t:'Bare waste: <b>&lt;500m (1%)</b> per roll'}
    ]},

  { id:'SOP-07', type:'sop', color:'#8b5cf6', icon:'📏', title:'Bare Waste Control',
    scope:'Unwinder stop diameter — Met-1 & Met-2',
    tags:['Waste','Process'], qualityTag:false,
    points:[
      {n:'Met-1', t:'6" Steel=<b>181mm</b> | Paper 12mm=<b>184mm</b> | Paper 14mm=<b>188mm</b>'},
      {n:'Met-2', t:'8" Steel=<b>222mm</b> | Paper 17mm=<b>241mm</b> | Paper 19mm=<b>245mm</b>'},
      {n:'Rule', t:'In-se pehle roll nahi nikalna — <b>logbook mein record karo</b>'}
    ]},

  { id:'SOP-08', type:'sop', color:'#8b5cf6', icon:'🔧', title:'Copper Clamp Change',
    scope:'Water circuit copper clamp replacement procedure',
    tags:['Maintenance','Safety'], safetyTag:true,
    points:[
      {n:'Seq', t:'SCADA → <b>Pneumatic Valve RED</b> → Main Butterfly Valve CLOSE → Drain'},
      {n:'Clean', t:'Remove clamp → <b>Scotch-Brite clean</b> → New clamp → Torque'},
      {n:'Restore', t:'Valves restore → SCADA check → pressure verify'}
    ]},

  { id:'SOP-09', type:'sop', color:'#8b5cf6', icon:'🎯', title:'Ripple Free Slitting',
    scope:'Slitter parameters for ripple-free output',
    tags:['Slitter','Quality','Parameters'], qualityTag:true,
    points:[
      {n:'Tension', t:'Rewinding Tension: <b>90 N/M</b> | Unwinder Tension: <b>90 N/M</b>'},
      {n:'Nip', t:'Nip Pressure: <b>700 N/m²</b>'},
      {n:'Speed', t:'Speed: <b>500 M/Min</b>'}
    ]},

  { id:'SOP-10', type:'sop', color:'#8b5cf6', icon:'♻️', title:'AL Dust Disposal',
    scope:'Aluminium dust safe collection and disposal',
    tags:['Safety','5S','Waste'], safetyTag:true,
    points:[
      {n:'Flow', t:'20L container → <b>500L container</b> (near Met-2) → Forklift to Scrap Yard'},
      {n:'Rule', t:'No disposal in rain | No open storage outside'},
      {n:'Record', t:'Daily weight in logbook — mandatory'}
    ]},

  // ─── Met WIs ────────────────────────────────
  { id:'WI-01', type:'wi', color:'#f97316', icon:'▶️', title:'Metallizer Startup',
    scope:'Machine startup sequence — step by step',
    tags:['Process','Startup'],
    points:[
      {n:'1', t:'Chilled water check → Source clean + boats inspect'},
      {n:'2', t:'Input parameters → Recipe select → Vacuum start'},
      {n:'3', t:'Vacuum OK → Start production run'}
    ]},

  { id:'WI-02', type:'wi', color:'#f97316', icon:'⏹️', title:'Metallizer Shutdown',
    scope:'Proper shutdown sequence after last roll',
    tags:['Process','Shutdown'],
    points:[
      {n:'1', t:'Last roll finish → <b>Vent sequence</b> start'},
      {n:'2', t:'Unload roll → Machine shutdown sequence'},
      {n:'3', t:'Chiller shutdown — proper sequence follow karo'}
    ]},

  { id:'WI-03', type:'wi', color:'#f97316', icon:'🎞️', title:'Bare Film Selection',
    scope:'Jumbo roll select karke machine tak lane ka process',
    tags:['Process','Quality'], qualityTag:true,
    points:[
      {n:'Plan', t:'MET/F/04 planning format check karo'},
      {n:'Verify', t:'Roll metallize side confirm karo | Crane to machine'},
      {n:'Setup', t:'Shield plate width ke anusaar adjust | Graphite Suspension Paint apply'}
    ]},

  { id:'WI-04', type:'wi', color:'#f97316', icon:'⛵', title:'Boat Change Programme',
    scope:'Full boat change + chamber cleaning cycle',
    tags:['Maintenance','Process'],
    points:[
      {n:'Clean', t:'Evaporator clean → Drum/Shield AL oxide clean → Vacuum dust'},
      {n:'Boats', t:'<b>Graphite Foil</b> both ends → Boats tightly fit'},
      {n:'Final', t:'Clean rollers + plasma | Verify all boats fixed'}
    ]},

  { id:'WI-05', type:'wi', color:'#ef4444', icon:'⚠️', title:'Moving Parts Safety',
    scope:'Running machine ke paas safety rules',
    tags:['Safety'], safetyTag:true,
    points:[
      {n:'❌', t:'No guards removal on running machine | No touch on rotating rolls'},
      {n:'❌', t:'No loose clothes | Safety shoes mandatory always'},
      {n:'❌', t:'Dancer Roller stop karo film threading se pehle'}
    ],
    alert:{color:'rgba(239,68,68,.12)',border:'#ef4444',text:'⛔ Running machine pe koi bhi hand/cloth near rotating parts — FORBIDDEN'}},

  { id:'WI-06', type:'wi', color:'#f97316', icon:'🥁', title:'Coating Drum Cleaning',
    scope:'Drum cleaning — acetone + caustic soda process',
    tags:['Maintenance','Safety'], safetyTag:true,
    points:[
      {n:'Method', t:'Film remove → Foot switch run → Drum cleaner tool → <b>Acetone wipe</b>'},
      {n:'Chemical', t:'Caustic Soda <20% OK — but <b>RUBBER GLOVES mandatory</b>'},
      {n:'Safety', t:'PPE: Gloves + Goggles + Mask — no skin contact with chemicals'}
    ]},

  { id:'WI-07', type:'wi', color:'#f97316', icon:'🛡️', title:'Shield & Shutter Cleaning',
    scope:'Aluminium buildup cleaning from shield/shutter',
    tags:['Maintenance','Process'],
    points:[
      {n:'Tools', t:'Copper Rod + Scrapper → Copper Brush (no scratches!)'},
      {n:'Coat', t:'<b>Boron Nitride Suspension Paint</b> apply karo'},
      {n:'Set', t:'Shield adjust karo — film ko touch nahi karna chahiye'}
    ]},

  { id:'WI-08', type:'wi', color:'#f97316', icon:'🧵', title:'Film Threading',
    scope:'New roll thread karne ka correct path',
    tags:['Process','Quality'], qualityTag:true,
    points:[
      {n:'1', t:'Roll damage check | Job Card se metallize side confirm'},
      {n:'2', t:'All rollers mein thread karo (correct path)'},
      {n:'3', t:'Web tension check karo — uniform hona chahiye'}
    ]},

  { id:'WI-09', type:'wi', color:'#f97316', icon:'🔩', title:'Shaft Fixing',
    scope:'Roll shaft correctly install karna — torque spec ke saath',
    tags:['Process','Maintenance'],
    points:[
      {n:'1', t:'Crane + Belt → Core mein shaft enter karo'},
      {n:'2', t:'Centre adjust → <b>Torque Wrench 160 NM</b> — mandatory'},
      {n:'3', t:'Electric trolley insert karo — secure karo'}
    ],
    alert:{color:'rgba(251,191,36,.1)',border:'#fbbf24',text:'⚠️ Torque: 160 NM — kam ya zyada dono dangerous. Torque wrench use karo!'}},

  { id:'WI-10', type:'wi', color:'#f97316', icon:'🔄', title:'Roll Loading / Unloading',
    scope:'Met jumbo roll change — both sides simultaneously',
    tags:['Process','Safety'], safetyTag:true,
    points:[
      {n:'Off', t:'Tension OFF → Film cut → Chucks unlock'},
      {n:'Remove', t:'Crane + hanger both sides → Slowly remove'},
      {n:'Rule', t:'<b>No metal/oil/grease on felt</b> | Shift core shaft | Load new roll'}
    ]},

  { id:'WI-11', type:'wi', color:'#f97316', icon:'⚡', title:'Metallization Process',
    scope:'Production run — Auto Mode operation',
    tags:['Process','Quality'], qualityTag:true,
    points:[
      {n:'Input', t:'Feed all parameters → Select SOP recipe → <b>Auto Mode</b>'},
      {n:'Run', t:'Select ALL wires → Stage = "Metallise" → Wire feeding start'},
      {n:'Monitor', t:'OD + Power continuously monitor → Vent when roll complete'}
    ]},

  { id:'WI-12', type:'wi', color:'#ef4444', icon:'🚪', title:'Open Chamber',
    scope:'Safe chamber opening protocol',
    tags:['Safety'], safetyTag:true,
    points:[
      {n:'1', t:'<b>Vent complete</b> hone ke baad hi kholo — kabhi bhi vacuum mein nahi'},
      {n:'2', t:'Area clear confirm karo → <b>Exhaust fan ON</b>'},
      {n:'3', t:'PPE: WI-14 ke anusaar — then open chamber'}
    ]},

  { id:'WI-13', type:'wi', color:'#f97316', icon:'🔍', title:'Quality Inspection',
    scope:'In-process quality monitoring during metallization',
    tags:['Quality'], qualityTag:true,
    points:[
      {n:'OD', t:'Hawkeye monitor se OD continuously dekho — SOP range mein hona chahiye'},
      {n:'Visual', t:'Visual uniformity check — no bands, no bare patches'},
      {n:'Record', t:'Logbook <b>MET/F/01</b> mein record karo | Deviation = Supervisor inform'}
    ]},

  { id:'WI-14', type:'wi', color:'#ef4444', icon:'🏭', title:'AL Dust / Heat / Noise Safety',
    scope:'Metallizer chamber dust + hazard safety rules',
    tags:['Safety'], safetyTag:true,
    points:[
      {n:'Dust', t:'Cart exit ke baad <b>Exhaust fan ON</b> → 1 min wait → then enter'},
      {n:'PPE', t:'<b>Mask + Gloves + Goggles</b> — mandatory before chamber area'},
      {n:'AL', t:'AL scrap pe pani nahi | Weekly transfer to stores | Ear plugs running machine mein'}
    ]},

  { id:'WI-15', type:'wi', color:'#f97316', icon:'🎗️', title:'Paper Tape Disposal',
    scope:'Shield paper tape remove + chill roll cleaning',
    tags:['Process','Safety'], safetyTag:true,
    points:[
      {n:'Remove', t:'Shields set properly → Gently remove tape — no tearing'},
      {n:'Clean', t:'Chill roll <b>Acetone clean</b> karo — no tape residue'},
      {n:'Dispose', t:'Metallic Dust Bin mein — Goggles+Gloves+Mask mandatory | No Acetone contact with tape'}
    ]},

  { id:'WI-16', type:'wi', color:'#f97316', icon:'🔁', title:'Cycle Maintenance',
    scope:'Between-cycle complete maintenance checklist',
    tags:['Maintenance','Process'],
    points:[
      {n:'Check', t:'Boats check/clean | Wire feed check | Shutter clean | Chamber dust'},
      {n:'Clean', t:'Shield clean + paint | Drum clean + masking tape | Shield setting adjust'},
      {n:'Load', t:'Load/unload rolls | Web thread karo | Proper core at rewinder'}
    ]},

  { id:'WI-17', type:'wi', color:'#f97316', icon:'♻️', title:'Film Waste Disposal',
    scope:'Bare + Met film waste — shift end pe mandatory disposal',
    tags:['Waste','Process','5S'],
    points:[
      {n:'Bare', t:'Bare film → weigh → register → <b>Erema Plant</b>'},
      {n:'Met', t:'Met film (Sheet+Trim+Off Cut) → weigh → register → <b>D-Met Plant</b>'},
      {n:'Cores', t:'Cores → Core Scrap Yard | Sab kuch <b>shift end se pehle</b>'}
    ]},

  { id:'WI-18', type:'wi', color:'#f97316', icon:'🔧', title:'Source Area Clean + EV Boats',
    scope:'Evaporator boat change + source area cleaning',
    tags:['Maintenance'],
    points:[
      {n:'1', t:'Old boats remove → <b>Vacuum AL dust</b> → Copper brush clean'},
      {n:'2', t:'New boats + <b>Graphite Foil</b> → AL wire position adjust'},
      {n:'3', t:'All boats fixed — check karo before vacuum'}
    ]},

  { id:'WI-19', type:'wi', color:'#f97316', icon:'🌀', title:'Cork Tape Layering',
    scope:'Path roller cork tape application — correct technique',
    tags:['Maintenance','Process'],
    points:[
      {n:'Prep', t:'IPA clean → 2 flat turns anchor → <b>30°–45° spiral</b> (35°–40° high speed)'},
      {n:'Overlap', t:'2–3mm overlap maintain karo → 2 flat turns finish'},
      {n:'Seal', t:'Epoxy/adhesive seal → Optional 80–100°C heat cure | Life: <b>>6 months</b>'}
    ]},

  { id:'WI-20', type:'wi', color:'#f97316', icon:'⛵', title:'Boat Issuance & Consumption',
    scope:'Evaporation boat stock management — strict rules',
    tags:['Process','Accountability'],
    points:[
      {n:'Limit', t:'Max floor stock: <b>400</b> (new+old) | Max new boats: <b>200</b>'},
      {n:'Rule', t:'<b>1:1 ratio</b> — Old returned = New issued only'},
      {n:'Auth', t:'HOD-approved slip mandatory | Penalty: Suspension + HR action'}
    ],
    alert:{color:'rgba(239,68,68,.1)',border:'#ef4444',text:'⛔ Bina old return ke new boats issue nahi — koi exception nahi'}},

  { id:'WI-21', type:'wi', color:'#f97316', icon:'📜', title:'GMP & General Instructions',
    scope:'Full team ke liye GMP guidelines — KRA ka hissa',
    tags:['Process','Quality','Safety','GMP'], qualityTag:true, safetyTag:true,
    points:[
      {n:'Quality', t:'<b>0% B-Grade</b> policy | OD, Pin Hole, Crease — hara ek roll check'},
      {n:'Output', t:'Target: <b>10 Rolls/Day</b> | Setup max <b>15 min</b> | Bare waste ≤0.7%'},
      {n:'5S', t:'Current: 16/26 → Target: <b>24/26</b> this month | Daily 5S sheet mandatory'}
    ],
    alert:{color:'rgba(168,85,247,.1)',border:'#a855f7',text:'⚡ GMP follow karo = Promotion + Appraisal. SOP violation = Performance deduction'}},

  { id:'WI-22', type:'wi', color:'#f97316', icon:'👔', title:'Shift In-charge Responsibilities',
    scope:'Shift Incharge ki sabhi duties — dono machines',
    tags:['Process','Quality','Supervisor'], qualityTag:true,
    points:[
      {n:'SCADA', t:'Dono machines pe OD, Width, Tension, Spreader values verify karo'},
      {n:'Target', t:'Shift target: <b>10 Rolls</b> | One boat cycle: 8 (4HOD+4NOD) or 10 NOD'},
      {n:'Team', t:'Main: Ghanshyam, Anuj, Dishant | Second: Mohit, Ajab Singh'}
    ]},

  { id:'WI-23', type:'wi', color:'#f97316', icon:'🔬', title:'AlOx Film Metallisation',
    scope:'Specialty film — Met-1 only | Extreme care required',
    tags:['Quality','AlOx','Specialty'], qualityTag:true,
    points:[
      {n:'OD', t:'Metal OD: <b>0.45</b> (UCL 0.47 / LCL 0.42) | AlOx OD: <b>0.11</b>'},
      {n:'Freq', t:'Per boat cycle: <b>max 5 rolls</b> only (26,000m each)'},
      {n:'Curing', t:'Before topcoat: <b>40 days curing</b> from manufacturing date | No shortcuts!'}
    ],
    alert:{color:'rgba(56,189,248,.1)',border:'#38bdf8',text:'🔬 AlOx coating <40nm — bahut delicate. DTR1 roller bypass karo. No water on debris!'}},

  { id:'WI-24', type:'wi', color:'#f97316', icon:'📉', title:'Metallised Waste Reduction',
    scope:'Waste 1% se neeche rakhne ka breakdown',
    tags:['Waste','Quality'], qualityTag:true,
    points:[
      {n:'Start/Stop', t:'100m per roll → <b>≤0.138%</b> | Isse zyada = Operator responsibility'},
      {n:'Trim', t:'Total trim max <b>15mm</b> (dono taraf) → <b>≤0.535%</b>'},
      {n:'Total', t:'Target: <b>≤0.8%</b> | B-Grade: <b>0% — Zero Tolerance</b>'}
    ]},

  { id:'WI-25', type:'wi', color:'#f97316', icon:'⭐', title:'Slitting for Critical Customers',
    scope:'Jayesh, KFlex, Prabhat Pipe, Prakash Pipe — special care',
    tags:['Slitter','Quality','Critical'], qualityTag:true,
    points:[
      {n:'Load', t:'Material hamesha <b>Center Position</b> mein load karo — Edge pe kabhi nahi'},
      {n:'OD', t:'OD setpoint +0.2 higher — Ref: SOP-06'},
      {n:'Check', t:'Extra quality inspection: OD, Pin Hole, Edge damage — all verified'}
    ]},

  { id:'WI-26', type:'wi', color:'#06b6d4', icon:'💻', title:'Met Jumbo SAP Entry',
    scope:'Production entry — COR1 → ZPP_METJUMBO → ZJUMBO_PROD',
    tags:['SAP'], sapTag:true,
    points:[
      {n:'Login', t:'SAP ID: <b>POLY_MATEL_E</b> | Plant: <b>3001</b>'},
      {n:'Order', t:'T-Code <b>COR1</b> → Material 3SF-G… → Met-1: <b>GP03</b> / Met-2: <b>GP05</b>'},
      {n:'Entry', t:'T-Code <b>ZPP_METJUMBO</b> → Logbook se sari details → Ctrl+S → Verify <b>ZJUMBO_PROD</b>'}
    ],
    alert:{color:'rgba(6,182,212,.1)',border:'#06b6d4',text:'Settlement Period: Apr=01, May=02… Dec=10 | Controlling Area: 3000'}},

  { id:'WI-27', type:'wi', color:'#ef4444', icon:'🚨', title:'AlOx Metalliser Safety',
    scope:'AlOx debris handling — critical safety rules',
    tags:['Safety','AlOx'], safetyTag:true,
    points:[
      {n:'❌', t:'AlOx debris pe <b>KABHI PANI NAHI</b> — Water+AlOx = Hazardous!'},
      {n:'❌', t:'Flammable materials ke saath mix mat karo'},
      {n:'✅', t:'Separate dedicated container | PPE: Mask+Gloves+Goggles mandatory'}
    ],
    alert:{color:'rgba(239,68,68,.15)',border:'#ef4444',text:'🚨 AlOx + Water = NEVER. Yeh alag container mein rakho — strict rule hai'}},

  // ─── Slitter WIs ─────────────────────────────
  { id:'SL-01', type:'sl', color:'#0e7490', icon:'📋', title:'Roll Selection & Load on Unwinder',
    scope:'Planning check → SAP → Roll load on secondary slitter',
    tags:['Slitter','Process'],
    points:[
      {n:'1', t:'Planning format <b>MET/F/04</b> check karo'},
      {n:'2', t:'SAP mein Roll Availability confirm — plan ke anusaar Met Jumbo select'},
      {n:'3', t:'Job Card verify → Crane + Sling Belt → Unwinder pe load → Chuck lock'}
    ]},

  { id:'SL-02', type:'sl', color:'#0e7490', icon:'⚙️', title:'Slitting Machine Setup',
    scope:'Machine parameters set karna before production',
    tags:['Slitter','Process'],
    points:[
      {n:'Params', t:'Width, Core Width, Core ID, Arm positions feed karo'},
      {n:'Tension', t:'SOP-09 parameters: Tension 90N/M, Nip 700N/m², Speed 500 M/Min'},
      {n:'Auth', t:'<b>Supervisor setup verify kare</b> — tab hi slitting start'}
    ]},

  { id:'SL-03', type:'sl', color:'#0e7490', icon:'🔪', title:'Blade Change',
    scope:'Blade frequency — film thickness ke anusaar',
    tags:['Slitter','Maintenance','Safety'], safetyTag:true,
    points:[
      {n:'10-12µ', t:'Blade edge change: <b>minimum once per shift</b>'},
      {n:'15-23µ', t:'Blade edge change: as required per shift'},
      {n:'Safety', t:'Machine stop karo | <b>Safety Gloves mandatory</b> | Used blades = dedicated box'}
    ],
    alert:{color:'rgba(239,68,68,.1)',border:'#ef4444',text:'⚠️ Blunt blade = edge defect = customer complaint. Frequency follow karo!'}},

  { id:'SL-04', type:'sl', color:'#0e7490', icon:'📦', title:'Receive Paper Core',
    scope:'Store se core receive + verify + storage',
    tags:['Slitter','Process'],
    points:[
      {n:'Invoice', t:'Invoice pe core size refer karo'},
      {n:'Verify', t:'Core ID (3"/6"/8") | Thickness (13/15/16mm) | Type (RC/New)'},
      {n:'Store', t:'Size-wise segregate karke proper storage area mein'}
    ]},

  { id:'SL-05', type:'sl', color:'#0e7490', icon:'🔗', title:'Joint Formation',
    scope:'Jumbo change par joint banana — limit rules',
    tags:['Slitter','Quality'], qualityTag:true,
    points:[
      {n:'Stop', t:'First jumbo finish ya defect → <b>MACHINE STOP karo</b> first'},
      {n:'Joint', t:'Round/clean cut, no wrinkles, properly spliced'},
      {n:'Limit', t:'🇮🇳 Domestic: <b>max 2 joints</b> | ✈️ Export: <b>max 1 joint</b>'}
    ],
    alert:{color:'rgba(249,115,22,.1)',border:'#f97316',text:'Export orders mein sirf 1 joint. Zyada = Downgrade/Reject'}},

  { id:'SL-06', type:'sl', color:'#0e7490', icon:'▶️', title:'Slitting Start',
    scope:'Supervisor verify karke slitting start karna',
    tags:['Slitter','Process'],
    points:[
      {n:'Check', t:'Width, Tension, Nip, Speed, Blade — sab verify karo'},
      {n:'Auth', t:'<b>Slitter Supervisor</b> setup verify kare — tabhee start'},
      {n:'Log', t:'Slitter Logbook <b>MET/F/02</b> mein Machine Start Time record karo'}
    ]},

  { id:'SL-07', type:'sl', color:'#0e7490', icon:'📦', title:'Slit Roll Unloading & Wrapping',
    scope:'QC check → Wrapping → Conveyor pe load',
    tags:['Slitter','Quality'], qualityTag:true,
    points:[
      {n:'QC', t:'Pehle <b>Slitting Officer + QC Officer</b> se quality check — tab wrap karo'},
      {n:'Wrap', t:'OK rolls: <b>Blue Air Bubble 100 GSM</b> se wrap karo'},
      {n:'Unload', t:'Conveyor forward → Plastic pallets set → UNLOAD PUSH BUTTON → UNCHUCK'}
    ]},

  { id:'SL-08', type:'sl', color:'#0e7490', icon:'🏷️', title:'Roll ID Nomenclature',
    scope:'Slit roll label + Roll ID decode',
    tags:['Slitter','SAP','Quality'], sapTag:true,
    points:[
      {n:'Format', t:'<b>G M A 25 F 0001 C PB 2</b>'},
      {n:'Decode', t:'Film Type | Machine | Month (A=Jan…L=Dec) | Year | Material | Serial'},
      {n:'Position', t:'L=Operator side | R=Drive side | L/C/R (3 rolls) | L/A/B/R (4 rolls)'}
    ],
    alert:{color:'rgba(14,116,144,.1)',border:'#0e7490',text:'Grade: 2=OK | 3=Downgrade | 5=Salvageable | 6=Offcut | 7=Coating | 8=Order Awaited'}},

  { id:'SL-09', type:'sl', color:'#0e7490', icon:'👔', title:'Slitting Supervisor Responsibilities',
    scope:'Supervisor ki entry discipline + accountability',
    tags:['Slitter','Supervisor','Accountability'],
    points:[
      {n:'Entry', t:'Only 3 designated operators — sequential. Sign mandatory after each entry.'},
      {n:'Marking', t:'AMCOR, UMAX, Export rolls pe <b>Direction Arrow marking</b> ensure karo'},
      {n:'Team', t:'Main: Manjeet (263), Gurpreet (430), Mohit (426) | Second: Ishwar Tiwari, Parvez Ali, Sanjay'}
    ]},

  { id:'SL-10', type:'sl', color:'#0e7490', icon:'💻', title:'Met Slitting SAP Entry',
    scope:'ZPP_SLIT → Entry → ZSLIT_PROD verify',
    tags:['Slitter','SAP'], sapTag:true,
    points:[
      {n:'Login', t:'T-Code: <b>ZPP_SLIT</b> | Met-1: <b>3-M1_S</b> | Met-2: <b>3-M2_S</b>'},
      {n:'Fill', t:'Material 3FG-G… | No of Rolls | Core details | Film details | Metal Side I/O'},
      {n:'Grade', t:'2=OK | 3=Downgrade | 5=Salvageable | 6=Offcut | Grade 5 → dedicated area shift'}
    ],
    alert:{color:'rgba(14,116,144,.1)',border:'#0e7490',text:'Verify: T-Code ZSLIT_PROD | Controlling Area: 3000 | Test Run UNCHECK!'}}
];

let _trainTab = 'all';
let _trainSearch = '';

function setTrainTab(tab, el){
  _trainTab = tab;
  document.querySelectorAll('.ttab').forEach(b=>b.classList.remove('ttab-on'));
  el.classList.add('ttab-on');
  renderTrainCards();
}

function filterTraining(){
  _trainSearch = (document.getElementById('trainSearch')||{value:''}).value.toLowerCase();
  renderTrainCards();
}

// Man Power Training section open/close
function openMetTrainSection(type){
  const trainArea  = document.getElementById('mpTrainArea');
  const careerArea = document.getElementById('mpCareerArea');
  if(!trainArea || !careerArea) return;
  if(type === 'career'){
    trainArea.style.display = 'none';
    careerArea.style.display = 'block';
    setTimeout(()=>careerArea.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
    return;
  }
  careerArea.style.display = 'none';
  trainArea.style.display = 'block';
  const tabMap = {sop:'sop',wi:'wi',sl:'sl'};
  const initTab = tabMap[type]||'all';
  const tabRow = document.getElementById('trainTabRow');
  const labels = {sop:'📋 SOPs',wi:'🏭 Met WI',sl:'✂️ Slitter',safety:'🦺 Safety',sap:'💻 SAP',quality:'🎯 Quality',all:'All (47)'};
  if(tabRow) tabRow.innerHTML = ['sop','wi','sl','safety','sap','quality','all'].map(k=>
    `<button class="ttab${k===initTab?' ttab-on':''}" onclick="setTrainTab('${k}',this)">${labels[k]}</button>`
  ).join('');
  _trainTab = initTab;
  _trainSearch = '';
  const srch = document.getElementById('trainSearch');
  if(srch) srch.value = '';
  renderTrainCards();
  setTimeout(()=>trainArea.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
}

function closeMetTrainSection(){
  const ta = document.getElementById('mpTrainArea');
  const ca = document.getElementById('mpCareerArea');
  if(ta) ta.style.display = 'none';
  if(ca) ca.style.display = 'none';
}

function openPaidPlan(planKey){
  const pi = PLAN_INFO[planKey];
  if(!pi) return;
  const isBasic = planKey.endsWith('_basic');
  const catNames = {supervisor:'Supervisory Skills',managerial:'Managerial Skills',msoffice:'MS Office & Efficiency'};
  const cat = planKey.replace('_basic','').replace('_advanced','');
  const catName = catNames[cat] || pi.name;
  const tier = isBasic ? 'Basic' : 'Advanced';
  const topicsByPlan = {
    supervisor_basic:    ['Shift Handover Process','Manpower Assignment','Logbook Compliance','5S Audit Checklist','NCR Handling Basics'],
    supervisor_advanced: ['Shift Handover','Manpower Assignment','Logbook Compliance','5S Audit','NCR Handling','Productivity KPIs','Conflict Resolution','Shift Report Writing','Safety Incident Handling','SOP Enforcement'],
    managerial_basic:    ['Planning Fundamentals','KPI Introduction','Cost Awareness','Communication Basics','Team Motivation'],
    managerial_advanced: ['Production Planning','KPI Dashboard','Cost Control','People Management','Leadership Styles','Decision Making','Data Analysis','Budget Awareness','Cross-dept Coordination','Performance Reviews'],
    msoffice_basic:      ['Excel Basics','Data Entry Best Practices','Word Documents','Simple Charts','Basic Formulas (SUM, AVERAGE, COUNT)'],
    msoffice_advanced:   ['VLOOKUP & SUMIF','Pivot Tables','Advanced Charts','Word Report Templates','PowerPoint Presentations','Data Validation','Conditional Formatting','Excel Shortcuts','Dashboard Creation','Productivity Hacks'],
  };
  const topics = topicsByPlan[planKey]||[];
  openModal(`
    <div style="padding:20px 16px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:40px;margin-bottom:8px">${pi.icon}</div>
        <div style="font-size:18px;font-weight:900;color:#fff">${catName}</div>
        <div style="font-size:13px;color:var(--muted2);margin-top:3px">${tier} Plan</div>
        <div style="font-size:36px;font-weight:900;color:${pi.color};font-family:'Barlow Condensed',sans-serif;margin:10px 0 0">₹${pi.price}<span style="font-size:14px">/month</span></div>
      </div>
      <div style="background:var(--card);border-radius:12px;padding:12px;margin-bottom:14px">
        <div style="font-size:10px;font-weight:900;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📚 Topics Covered</div>
        ${topics.map(t=>`<div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:${pi.color}">✓</span><span style="font-size:12px;color:var(--text)">${t}</span></div>`).join('')}
      </div>
      <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:10px;padding:10px 12px;margin-bottom:14px">
        <div style="font-size:11px;color:#fbbf24;font-weight:700">🚧 Coming Soon</div>
        <div style="font-size:11px;color:var(--muted2);margin-top:3px">Yeh course abhi development mein hai. Launch hone par aapko notify kiya jayega.</div>
      </div>
      <button onclick="closeModal()" style="width:100%;padding:14px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit">🔔 Notify Me on Launch</button>
    </div>
  `);
}

function toggleCareerSection(){
  const sec = document.getElementById('careerSection');
  const arr = document.getElementById('careerArrow');
  if(!sec) return;
  const show = sec.style.display==='none';
  sec.style.display = show ? 'block' : 'none';
  if(arr) arr.textContent = show ? '▼' : '▶';
}

function renderTrainCards(){
  const container = document.getElementById('trainCards');
  if(!container) return;
  const search = _trainSearch;
  const tab = _trainTab;

  const filtered = MET_TRAIN_DATA.filter(item=>{
    // Tab filter
    if(tab==='sop' && item.type!=='sop') return false;
    if(tab==='wi' && item.type!=='wi') return false;
    if(tab==='sl' && item.type!=='sl') return false;
    if(tab==='safety' && !item.safetyTag) return false;
    if(tab==='sap' && !item.sapTag) return false;
    if(tab==='quality' && !item.qualityTag) return false;
    // Search filter
    if(search){
      const haystack = (item.id+' '+item.title+' '+(item.tags||[]).join(' ')+' '+
        item.points.map(p=>p.t).join(' ')).toLowerCase();
      if(!haystack.includes(search)) return false;
    }
    return true;
  });

  if(!filtered.length){
    container.innerHTML = '<div class="train-no-results">😕 Koi result nahi mila<br><span style="font-size:11px">Try different keyword</span></div>';
    return;
  }

  // Group by type
  let html = '';
  const groups = [
    {key:'sop', label:'📋 Standard Operating Procedures', items: filtered.filter(x=>x.type==='sop')},
    {key:'wi',  label:'🏭 Metalliser Work Instructions',   items: filtered.filter(x=>x.type==='wi')},
    {key:'sl',  label:'✂️ Slitter Work Instructions',      items: filtered.filter(x=>x.type==='sl')},
  ];
  groups.forEach(g=>{
    if(!g.items.length) return;
    html += `<div class="tc-section-hdr">${g.label} <span style="color:#fbbf24;font-family:'Barlow Condensed',sans-serif;font-size:12px">${g.items.length}</span></div>`;
    g.items.forEach(item=>{
      html += buildTrainCard(item);
    });
  });
  container.innerHTML = html;
}

function buildTrainCard(item){
  const tagColors = {
    'Safety':'rgba(239,68,68,.15);color:#f87171',
    'Quality':'rgba(34,197,94,.12);color:#4ade80',
    'SAP':'rgba(6,182,212,.12);color:#67e8f9',
    'Process':'rgba(249,115,22,.12);color:#fb923c',
    'Maintenance':'rgba(56,189,248,.12);color:#38bdf8',
    'Waste':'rgba(251,191,36,.12);color:#fbbf24',
    'Slitter':'rgba(14,116,144,.15);color:#67e8f9',
    'AlOx':'rgba(168,85,247,.15);color:#c084fc',
    'Specialty':'rgba(168,85,247,.15);color:#c084fc',
    'Supervisor':'rgba(251,191,36,.12);color:#fbbf24',
    'Parameters':'rgba(16,185,129,.12);color:#4ade80',
    '5S':'rgba(163,230,53,.12);color:#bef264',
  };
  const tagsHtml = (item.tags||[]).slice(0,3).map(t=>{
    const s = tagColors[t] || 'rgba(255,255,255,.06);color:rgba(255,255,255,.5)';
    return `<span class="tc-tag" style="background:${s.split(';')[0]};${s.split(';')[1]||''}">${t}</span>`;
  }).join('');

  const pointsHtml = item.points.map(p=>
    `<div class="tc-point">
      <div class="tc-pnum" style="background:${item.color}22;color:${item.color}">${p.n}</div>
      <div class="tc-ptext">${p.t}</div>
    </div>`
  ).join('');

  const alertHtml = item.alert ?
    `<div class="tc-alert" style="background:${item.alert.color};border-color:${item.alert.border};margin-top:8px">
      <div style="font-size:11px;color:${item.alert.border};font-weight:700">${item.alert.text}</div>
    </div>` : '';

  return `<div class="tc" id="tc_${item.id.replace('-','_')}">
    <div class="tc-head" onclick="toggleTrainCard('tc_${item.id.replace('-','_')}')">
      <div class="tc-num" style="background:${item.color}22;color:${item.color}">
        ${item.icon}<br><span style="font-size:9px">${item.id}</span>
      </div>
      <div style="flex:1;min-width:0">
        <div class="tc-title">${item.title}</div>
        <div class="tc-scope">${item.scope}</div>
      </div>
      <div class="tc-arrow">▶</div>
    </div>
    <div class="tc-tags">${tagsHtml}</div>
    <div class="tc-body">
      ${pointsHtml}
      ${alertHtml}
    </div>
  </div>`;
}

function toggleTrainCard(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.toggle('open');
}

// ── LEARN — MODULE SYSTEM
// ════════════════════════════════════════════════════════════════

const LEARN_MODULES = {
  demo: {
    name:'Demo', icon:'🎬', color:'#fff', isFree:true,
    subtitle:'Free Preview — See what this platform offers',
    lessons:[
      { id:'d1', title:'Welcome to Man Power Learn', desc:'What this platform covers and how to use it effectively.', audio:true, video:false, live:false },
      { id:'d2', title:'What is Vacuum Metallising?', desc:'A quick visual introduction to the metalliser process.', audio:true, video:true, live:false },
      { id:'d3', title:'Platform Tour', desc:'How to navigate modules, find content, and track progress.', audio:true, video:false, live:false },
    ]
  },
  basic: {
    name:'Basic Free', icon:'🌱', color:'#22c55e', isFree:true,
    subtitle:'Foundation for every metalliser professional',
    lessons:[
      { id:'b1', title:'Vacuum Metallising — Concept & Process', desc:'How aluminium gets deposited on film under vacuum.', audio:true, video:true, live:false },
      { id:'b2', title:'Machine Layout & Key Components', desc:'Understand the basic parts of a metalliser machine.', audio:true, video:false, live:false },
      { id:'b3', title:'Safety — PPE & Work Practices', desc:'Essential personal protection and safety rules on shop floor.', audio:true, video:false, live:false },
      { id:'b4', title:'Basic Quality Points', desc:'OD, defect types, visual check, and why quality matters.', audio:true, video:false, live:false },
      { id:'b5', title:'Industrial Awareness for Beginners', desc:'Shift culture, shift handover, communication basics.', audio:true, video:false, live:false },
    ]
  },
  met_operation: {
    name:'Advanced Met Opr.', icon:'🏭', color:'#f97316', isFree:false, plan:'met_operation',
    subtitle:'Practical operator-level mastery of metalliser operations',
    lessons:[
      { id:'mo1', title:'Process Parameters — Deep Dive', desc:'Wire rate, evaporation speed, tension, rewind — practical understanding.', audio:true, video:true, live:true },
      { id:'mo2', title:'OD Control Mastery', desc:'How to measure, record, and control Optical Density consistently.', audio:true, video:true, live:false },
      { id:'mo3', title:'Defect Prevention & Analysis', desc:'Pinholes, streaks, edge curl, blocking — causes and on-spot fixes.', audio:true, video:false, live:true },
      { id:'mo4', title:'Running Precautions', desc:'Machine behaviour during run, early warning signs, operator actions.', audio:true, video:false, live:false },
      { id:'mo5', title:'Production Handling & Log', desc:'Reel handling, labelling, storage, production entry system.', audio:true, video:false, live:false },
      { id:'mo6', title:'Shift-Level Problem Solving', desc:'How to identify and resolve common issues without stopping production.', audio:true, video:true, live:true },
      { id:'mo7', title:'Common Operator Mistakes & Corrections', desc:'Real examples from shop floor — what goes wrong and why.', audio:true, video:false, live:false },
    ]
  },
  met_maintenance: {
    name:'Advanced Met Maint.', icon:'🔧', color:'#38bdf8', isFree:false, plan:'met_maintenance',
    subtitle:'Hands-on maintenance mastery from the shop floor',
    lessons:[
      { id:'mm1', title:'Machine Assemblies — Know Your Machine', desc:'Key assemblies: winding, unwinding, evaporator boat, vacuum system.', audio:true, video:true, live:true },
      { id:'mm2', title:'Preventive Maintenance Schedule', desc:'Daily, weekly, monthly PM checklist and its purpose.', audio:true, video:false, live:false },
      { id:'mm3', title:'Breakdown Handling Protocol', desc:'Step-by-step approach to any breakdown — think before you act.', audio:true, video:true, live:true },
      { id:'mm4', title:'Spare Parts Understanding', desc:'Critical spares, lead times, how to identify and order correctly.', audio:true, video:false, live:false },
      { id:'mm5', title:'Troubleshooting Logic', desc:'Fault tree thinking, eliminate-and-confirm method, documentation.', audio:true, video:true, live:false },
      { id:'mm6', title:'Oil & Lubrication Practical', desc:'Types of oils used, frequency, method, and mistakes to avoid.', audio:true, video:false, live:true },
      { id:'mm7', title:'Practical Machine Care', desc:'Daily cleaning, observation habits, and component life extension.', audio:true, video:false, live:false },
    ]
  },
  supervisor: {
    name:'Advanced Supervisor', icon:'👔', color:'#a3e635', isFree:false, plan:'supervisor',
    subtitle:'Lead your shift with confidence and competence',
    lessons:[
      { id:'sv1', title:'Shift Supervision — What It Really Means', desc:'Responsibility, authority, accountability — understanding your role.', audio:true, video:false, live:false },
      { id:'sv2', title:'Manpower Management on Shift', desc:'Task allocation, skill matching, handling absenteeism.', audio:true, video:false, live:true },
      { id:'sv3', title:'Reporting Systems that Work', desc:'Shift reports, production logs, deviation reports — how to write them right.', audio:true, video:true, live:false },
      { id:'sv4', title:'Quality Complaint Prevention', desc:'Upstream thinking — how to stop complaints before they happen.', audio:true, video:false, live:true },
      { id:'sv5', title:'SOP Implementation on Shop Floor', desc:'How to make people actually follow SOPs — practical approach.', audio:true, video:false, live:false },
      { id:'sv6', title:'Discipline & Follow-Up', desc:'Fair discipline, documented warnings, follow-up culture.', audio:true, video:false, live:false },
      { id:'sv7', title:'Communication & Coordination', desc:'Cross-shift, cross-department, and vertical communication methods.', audio:true, video:true, live:false },
      { id:'sv8', title:'Audit Readiness Basics', desc:'5S, documentation, behaviour — how to stay always audit-ready.', audio:true, video:false, live:true },
    ]
  },
  managerial: {
    name:'Managerial Skill', icon:'📊', color:'#a855f7', isFree:false, plan:'managerial',
    subtitle:'Grow from professional to leader — practical management tools',
    lessons:[
      { id:'mg1', title:'Planning Systems for Production', desc:'Daily, weekly, monthly planning structure with practical examples.', audio:true, video:true, live:false },
      { id:'mg2', title:'Review Methods that Drive Results', desc:'How to review, give feedback, and track action items.', audio:true, video:false, live:true },
      { id:'mg3', title:'Productivity Improvement Mindset', desc:'OEE basics, loss identification, small improvements = big results.', audio:true, video:true, live:false },
      { id:'mg4', title:'Cost Control — Practical Thinking', desc:'Where money goes, material waste, energy saving basics.', audio:true, video:false, live:false },
      { id:'mg5', title:'Interdepartmental Coordination', desc:'Working with stores, quality, HR, maintenance — how to collaborate.', audio:true, video:false, live:true },
      { id:'mg6', title:'Problem Solving Approach', desc:'WHY-WHY analysis, fishbone, structured problem communication.', audio:true, video:true, live:false },
      { id:'mg7', title:'Leadership Development', desc:'Consistency, trust-building, leading by example — real stories.', audio:true, video:false, live:false },
      { id:'mg8', title:'Tools, Apps & Systems for Career Growth', desc:'MS Office, report formats, digital tools used by top professionals.', audio:true, video:true, live:true },
    ]
  },

  // ════════════════════════════════════════════════
  // Man Power — SAMPLE TRAINING MODULES (customise for your industry)
  // Trainer: Mr. Vivek Kumar | Plant: Man Power Pvt. Ltd., Gurawara
  // ════════════════════════════════════════════════

  sample_sap: {
    name:'SAP Entry Training', icon:'💻', color:'#06b6d4', isFree:true,
    subtitle:'Man Power के असली SAP गलतियाँ और उनका सही तरीका — Real Training by Vivek Sir',
    sample:true,
    lessons:[
      {
        id:'gs1', title:'Slitting Production Entry — Common Mistakes (TN-01)',
        desc:'Wrong Micron mentioned, incorrect entry — सही तरीका सीखें।',
        date:'04.10.2025', sop:'MET/SOP/13 & MET/SOP/14', audio:false, video:false, live:false,
        content:{
          category:'⚠️ Common Mistakes',
          points:[
            { icon:'❌', label:'गलती #1 — Wrong Micron', text:'Roll का wrong micron mention करना — e.g. 12 micron की जगह 15 micron entry' },
            { icon:'❌', label:'गलती #2 — Incomplete Entry', text:'Production entry incomplete छोड़ना — सभी fields भरना जरूरी है' },
            { icon:'❌', label:'गलती #3 — Timing Mismatch', text:'Logbook timing और SAP timing में अंतर — logbook exact time SAP में डालें' },
            { icon:'✅', label:'सही तरीका', text:'Entry से पहले: Micron → OD → Width → Length → Roll Weight verify करें। फिर SAP में डालें।' },
            { icon:'📋', label:'SOP Reference', text:'SOP and Production Screen Familiarization — हर operator को screen पता होनी चाहिए' },
          ],
          rule:'⚠️ गलत entry से गलत production data → गलत planning → Loss!'
        }
      },
      {
        id:'gs2', title:'Metalliser Production Entry in SAP — Timing & Z-Report (TN-02)',
        desc:'Correct timing as per logbook, checking production in T-Code Z Report.',
        date:'04.10.2025', sop:'MET/SOP/13 & MET/SOP/14', audio:false, video:false, live:false,
        content:{
          category:'📊 SAP Production Entry',
          points:[
            { icon:'🕐', label:'Step 1 — Timing', text:'Logbook में देखो exact start और end time — वही SAP में डालो। अनुमान से नहीं।' },
            { icon:'📊', label:'Step 2 — Z Report Check', text:'Entry के बाद T-Code Z Report में production verify करो — quantity match होनी चाहिए' },
            { icon:'⚖️', label:'Step 3 — Waste Quantity', text:'Met Sheet Waste की exact quantity डालो — ज्यादा या कम दोनों गलत हैं' },
            { icon:'✅', label:'Complete Process', text:'1. Logbook check → 2. SAP entry → 3. Z Report verify → 4. Supervisor sign' },
            { icon:'🚫', label:'JUMBO Entry Mistake (TN-05)', text:'Roll No GJMA251885 — wrong waste quantity booked. हमेशा तौलकर entry करो।' },
          ],
          rule:'📌 Rule: SAP entry = Logbook data. कभी assume मत करो।'
        }
      },
      {
        id:'gs3', title:'Met Jumbo Production Entry — Correct Values (TN-22)',
        desc:'Met Jumbo entry में wrong values और waste generation कैसे रोकें।',
        date:'31.12.2025', sop:'On the Job Training', audio:false, video:false, live:false,
        content:{
          category:'📦 Jumbo Entry',
          points:[
            { icon:'⚖️', label:'Waste Weight', text:'Met Jumbo के waste को तौलकर exact weight SAP में डालो — estimate मत करो' },
            { icon:'📏', label:'Length & Width', text:'Jumbo roll का length और width logbook से match करके verify करो' },
            { icon:'🔢', label:'Roll Number', text:'Roll number correctly enter करो — GJMA format follow करो' },
            { icon:'👥', label:'Shift Supervisors', text:'यह training सभी Shift Supervisors को दी गई — TN-22 (31.12.2025)' },
            { icon:'✅', label:'Verification', text:'Entry के बाद Z Report में cross-check — supervisor countersign करे' },
          ],
          rule:'📌 Wrong Jumbo entry = गलत material balance = SAP में discrepancy!'
        }
      },
      {
        id:'gs4', title:'Grade Booking — 2 Grade vs 5 Grade Material (TNG25002)',
        desc:'HOD approval के बाद सही grade में material book करने का सही तरीका।',
        date:'07.03.2025', sop:'TNG25002', audio:false, video:false, live:false,
        content:{
          category:'📋 Grade Booking Rules',
          points:[
            { icon:'✅', label:'Rule 1', text:'HOD से discuss करके अगर 2 Grade material approved हो — तो 2 Grade में ही book करो' },
            { icon:'🚫', label:'Rule 2', text:'अगर HOD ने 2 Grade approve किया है तो 5 Grade में मत डालो' },
            { icon:'📊', label:'Rule 3', text:'अगर material 5 Grade में book किया है — तो SAP की same quantity report करो' },
            { icon:'⚠️', label:'Real Incident', text:'06.03.2025 — 5 Grade material 2.1 MT था SAP में, पर सिर्फ 0.4 MT report किया गया' },
            { icon:'👤', label:'Accountability', text:'गलत grade booking की जिम्मेदारी उस operator की होगी जिसने entry की' },
          ],
          rule:'📌 Always book as per HOD approval — Never hide or misreport grade.'
        }
      },
    ]
  },

  sample_process: {
    name:'Process & Machine', icon:'⚙️', color:'#f97316', isFree:true,
    subtitle:'Metalliser machine के real operation points — Man Power Shop Floor से सीधे',
    sample:true,
    lessons:[
      {
        id:'gp1', title:'Auto Mode for OD Meter — Steps to Follow (TN-23)',
        desc:'Machine Auto Mode में कैसे चलाएं — common mistake और सही steps।',
        date:'04.01.2026', sop:'MET/SOP/19', audio:false, video:false, live:false,
        content:{
          category:'🤖 Auto Mode Operation',
          points:[
            { icon:'⚡', label:'Common Mistake', text:'Web start करने के बाद Wire Feeding start करने से machine Auto Mode में नहीं जाती!' },
            { icon:'1️⃣', label:'Step 1', text:'Machine main — सभी Wires को Select करें' },
            { icon:'2️⃣', label:'Step 2', text:'Auto Mode पर Click करें' },
            { icon:'3️⃣', label:'Step 3', text:'Production Dashboard में Machine का Stage "Metallise" होना चाहिए' },
            { icon:'✅', label:'Correct Sequence', text:'Wires Select → Auto Mode → Verify Stage = "Metallise" → तब Wire Feeding start करें' },
          ],
          rule:'⚠️ Stage "Metallise" नहीं हुई तो Auto Mode नहीं चलेगा!'
        }
      },
      {
        id:'gp2', title:'Graphite Paste Application on Shutter (TN-03)',
        desc:'Shutter पर Graphite Paste सही से लगाना और Cycle Loss कैसे बचाएं।',
        date:'08.10.2025', sop:'SOP for Graphite Paste', audio:false, video:false, live:false,
        content:{
          category:'🔧 Graphite Paste Application',
          points:[
            { icon:'⚠️', label:'Problem', text:'Shutter पर गलत तरीके से paste लगाने से seal proper नहीं होती → Cycle Loss होता है' },
            { icon:'📅', label:'Incident', text:'08.10.2025 — 3020MM roll पर Cycle Loss हुआ गलत paste application से' },
            { icon:'✅', label:'Correct Method', text:'Paste thin और uniform layer में लगाएं — मोटी परत मत लगाएं' },
            { icon:'🔍', label:'Check Points', text:'1. Shutter clean हो\n2. Paste fresh हो\n3. Even application\n4. No gaps या lumps' },
            { icon:'💡', label:'Why Important', text:'Proper seal = proper vacuum = good coating quality। Cycle loss = time + material waste' },
          ],
          rule:'📌 हर cycle से पहले shutter और paste की condition verify करें।'
        }
      },
      {
        id:'gp3', title:'Crease Defect Correction at Met-2 (TN-21 + TNG25003)',
        desc:'Crease defect के 7 कारण और उनका on-spot solution।',
        date:'26.12.2025 & 03.06.2025', sop:'TNG25003', audio:false, video:false, live:false,
        content:{
          category:'🌀 Crease Defect Control — 7 Inspection Points',
          points:[
            { icon:'1️⃣', label:'Damaged Core', text:'Loading से पहले core check करो — दबा/टूटा/असमान core use न करें' },
            { icon:'2️⃣', label:'Rewinder Layerm', text:'Rewinder का layerm rolling के समय smooth और center में चलना चाहिए' },
            { icon:'3️⃣', label:'Unwinder Layerm', text:'Unwinder layerm straight और सही level पर हो — vibration या misalignment नहीं' },
            { icon:'4️⃣', label:'Banana Angle', text:'Banana roll का angle उपयुक्त रखें — film siding और crease control के लिए' },
            { icon:'5️⃣', label:'Spreader Angle', text:'Spreader roll दोनों side से बराबर हो — film का फैलाव समान हो' },
            { icon:'6️⃣', label:'Rewinder Cork Tape', text:'Tape अच्छी quality की हो, core पर सीधी और मजबूत लगी हो — मुड़ी नहीं' },
            { icon:'7️⃣', label:'Rewinder Nip Gap', text:'Rubber roll और film roll के बीच उचित gap — ज्यादा या कम दोनों से crease बनती है' },
          ],
          rule:'⚠️ Crease defect frequent होने पर तुरंत action लो — delay से downgrade material बढ़ता है!'
        }
      },
      {
        id:'gp4', title:'Core Selection Rules for Met Production (TN2603)',
        desc:'Metalliser production के लिए सही core कौन सी — weight के हिसाब से।',
        date:'21.01.2025', sop:'TN2603', audio:false, video:false, live:false,
        content:{
          category:'🔵 Core Selection Rules',
          points:[
            { icon:'✅', label:'Rule 1 — Heavy Rolls (>2200 kg)', text:'सिर्फ Aluminum Cores use करो जब roll weight 2200 kg से ज्यादा हो' },
            { icon:'✅', label:'Rule 2 — Light Rolls (<2200 kg)', text:'सिर्फ 14mm thick core use करो — और वो Good Condition में हो' },
            { icon:'✅', label:'Rule 3 — Very Heavy (>3000 kg)', text:'दोनों sides पर core 50mm से ज्यादा बाहर न निकली हो' },
            { icon:'🏗️', label:'Rule 4 — Lifting', text:'सिर्फ Core Plugs use करो Crane से roll उठाने के लिए — बिना plug कभी नहीं' },
            { icon:'💰', label:'Why Important', text:'एक 8" Core की कीमत = ₹1 लाख। Wrong practice = damaged core = huge loss' },
          ],
          rule:'⚠️ बिना Core Plug के crane से roll उठाना STRICTLY PROHIBITED!'
        }
      },
    ]
  },

  sample_safety: {
    name:'Safety & 5S', icon:'🛡️', color:'#ef4444', isFree:true,
    subtitle:'Man Power Safety Rules, Emergency Buttons, 5S Audit Points — सभी के लिए जरूरी',
    sample:true,
    lessons:[
      {
        id:'gsa1', title:'Emergency Buttons — Care & Safety (TN2614)',
        desc:'Emergency buttons, Crane Pendant, और Line of Fire awareness।',
        date:'08.03.2026', sop:'Safety SOP', audio:false, video:false, live:false,
        content:{
          category:'🚨 Emergency Safety Rules',
          points:[
            { icon:'🔴', label:'Emergency Stop Button', text:'E-Stop को कभी भी block या disable मत करो — हमेशा accessible रखो' },
            { icon:'🏗️', label:'Crane Pendant', text:'Crane pendant से load उठाते समय कभी load के नीचे मत खड़े रहो — LINE OF FIRE!' },
            { icon:'⚠️', label:'Line of Fire', text:'Moving load, rotating parts, या high-energy equipment के path में कभी मत आओ' },
            { icon:'🚨', label:'Emergency Procedure', text:'1. E-Stop दबाओ\n2. Area clear करो\n3. Supervisor को inform करो\n4. तब तक machine मत चालू करो जब तक clearance न मिले' },
            { icon:'🔍', label:'Daily Check', text:'हर shift शुरू में E-Stop buttons की condition verify करो' },
          ],
          rule:'🔴 Emergency button ने कभी किसी की जान बचाई है — इसे हमेशा काम करने की स्थिति में रखो!'
        }
      },
      {
        id:'gsa2', title:'5S Training — Audit Points (TN2606)',
        desc:'5S के 5 steps और Man Power audit में fail होने वाली activities।',
        date:'2026', sop:'5S Standard', audio:false, video:false, live:false,
        content:{
          category:'✨ 5S — 5 Steps',
          points:[
            { icon:'1️⃣', label:'Sort (छाँटना)', text:'कार्यक्षेत्र से अनावश्यक चीजें हटाओ — सिर्फ जरूरी सामान रखो' },
            { icon:'2️⃣', label:'Set in Order (व्यवस्थित)', text:'हर चीज की एक जगह — ताकि आसानी से ढूंढा जा सके' },
            { icon:'3️⃣', label:'Shine (चमकाना)', text:'मशीनों और area की daily सफाई — गंदगी में खराबी छुपती है' },
            { icon:'4️⃣', label:'Standardize (मानकीकरण)', text:'Rules बनाओ — Sort, Set, Shine बना रहे इसके लिए procedure' },
            { icon:'5️⃣', label:'Sustain (अनुशासन)', text:'5S को habit बनाओ — audit में नहीं, रोज करो' },
          ],
          rule:'📌 Audit में fail = Loose blade, aluminum dust खुले में, unorganized boxes, पुराने कपड़े area में!'
        }
      },
      {
        id:'gsa5', title:'5S Audit Checksheet — 13 Points Floor Audit (Met & Slitter)',
        desc:'Man Power का actual 5S floor audit checklist — सभी 13 checkpoints हिंदी और English में।',
        date:'March 2026', sop:'5S Audit Checksheet', audio:false, video:false, live:false,
        content:{
          category:'📋 5S Floor Audit — 13 Checkpoints (Score: ❌=0 ⚠️=1 ✅=2)',
          points:[
            { icon:'🔴', label:'Sort #1', text:'केवल जरूरी materials/tools ही machine के पास हों — अनावश्यक items हटे हों' },
            { icon:'🔴', label:'Sort #2', text:'Scrap rolls, empty cores, old parts — floor से remove किए गए हों' },
            { icon:'🔴', label:'Sort #3', text:'Waste drums/dustbins overflow नहीं, properly tagged हों' },
            { icon:'🟡', label:'Set in Order #4', text:'Tools (spanners, cutters, blades) — marked locations पर रखे हों' },
            { icon:'🟡', label:'Set in Order #5', text:'Input/Output rolls — designated yellow-marked areas में हों' },
            { icon:'🟡', label:'Set in Order #6', text:'Doctor blades, rubber rolls, cork tapes — systematically arranged हों' },
            { icon:'🟢', label:'Shine #7', text:'Machine body, control panel, rollers — clean और oil-free हों' },
            { icon:'🟢', label:'Shine #8', text:'Met/Slitter का floor clean और dry हो — film, dust, oil नहीं' },
            { icon:'🟢', label:'Shine #9', text:'Shift-end cleaning और area inspection regularly हो रही हो' },
            { icon:'🔵', label:'Standardize #10', text:'Cleaning schedule और responsibilities displayed और followed हों' },
            { icon:'🔵', label:'Standardize #11', text:'Audit charts और visual management boards updated हों' },
            { icon:'🟣', label:'Sustain #12', text:'Operators बिना reminder के 5S daily follow करें' },
            { icon:'🟣', label:'Sustain #13', text:'Shift Leaders/Engineers हर shift में floor audit और 5S follow-up करें' },
          ],
          rule:'📊 Max Score = 26 | Special: No open tools/blades near machine · No air/water leakage · All rolls tagged & stacked · Dustbins empty after every shift!'
        }
      },
      {
        id:'gsa6', title:'5S Responsibility Chart — कौन, कब, कहाँ',
        desc:'हर supervisor की 5S area responsibility — Man Power Met department day-wise।',
        date:'March 2026', sop:'5S Responsibility Sheet', audio:false, video:false, live:false,
        content:{
          category:'👥 5S Area Responsibility — Met Department',
          points:[
            { icon:'👤', label:'ANUJ (30000227) — Monday', text:'Area: Met-1 Inside Gangway' },
            { icon:'👤', label:'GHANSHYAM (30000201) — Tuesday', text:'Area: Met-2 Inside Gangway' },
            { icon:'👤', label:'MANJEET (30000263) — Wednesday', text:'Area: Met Slitter-1' },
            { icon:'👤', label:'GURPREET (30000430) — Thursday', text:'Area: Met Slitter-2' },
            { icon:'👤', label:'AJAB (30000493) — Friday', text:'Area: Jumbo Stand, Met Store, Office & Almirahs' },
            { icon:'👤', label:'DISHANT (30000506) — Saturday', text:'Area: Jumbo Stand, Met Store, Office & Almirahs' },
            { icon:'👤', label:'MOHIT (30000426) — Sunday', text:'Area: Jumbo Stand, Met Store, Office & Almirahs' },
          ],
          rule:'📌 अपना day आने पर अपना area खुद audit करो — कोई excuse नहीं! Audit score record होता है।'
        }
      },
      {
        id:'gsa7', title:'5S Visual Management — Man Power Plant Labels & Storage Locations',
        desc:'Man Power plant में लगे सभी area labels, tags और yellow markings — Set in Order का real example।',
        date:'2025-26', sop:'5S Visual Management', audio:false, video:false, live:false,
        content:{
          category:'🏷️ Man Power Plant — Visual Management (Set in Order)',
          points:[
            { icon:'📦', label:'NEW WIRE SPOOL (Yellow Box Marking)', text:'New Al wire spool boxes की dedicated spot — yellow tape से marked floor area। Photos में साफ दिख रहा है — यही perfect 5S है!' },
            { icon:'🔵', label:'8" ALUMINUM CORES (MET-2)', text:'8 inch aluminum cores की fixed storage — MET-2 area में clearly labeled' },
            { icon:'🔧', label:'6" & 8" SHAFT AREA', text:'Different size shafts के लिए अलग-अलग designated storage — mix-up नहीं होगा' },
            { icon:'🧹', label:'VACUUM CLEANER', text:'Vacuum cleaner की fixed spot — हमेशा same जगह, हमेशा accessible' },
            { icon:'⚡', label:'USABLE WIRE 2.2 OD / NON-USABLE Al. WIRE', text:'Usable और Non-Usable aluminum wire — अलग-अलग clearly tagged boxes में' },
            { icon:'🛒', label:'WINDING CART SPARE PARTS (MET-1&2)', text:'Winding cart spares की dedicated location — MET-1 और MET-2 दोनों के लिए' },
            { icon:'🔩', label:'MET-2 DRAW ROLLER SPARES', text:'Met-2 draw roller के spare parts — designated spot' },
            { icon:'👁️', label:'MET-2 HAWKEYE BEAM CALIBRATION WHEEL', text:'Hawkeye automatic OD calibration wheel की fixed storage location' },
            { icon:'🔥', label:'SAND FIRE BUCKET / DRUM', text:'Fire bucket और sand drum — emergency में तुरंत accessible, clearly marked' },
            { icon:'🚛', label:'CYLINDER MOVEMENT TROLLEY', text:'Gas cylinder trolley — fixed location, available when needed' },
            { icon:'🏗️', label:'MET-1 DRUM CLEANER TABLE', text:'Drum cleaning table — dedicated spot, MET-1 area' },
            { icon:'🚫', label:'DO NOT LEAN ❌ / REPAIRED TAG', text:'Damaged/repaired equipment पर warning tag — दूसरों को alert करने के लिए' },
            { icon:'📚', label:'WALL OF SOPs', text:'सभी active SOPs की wall display — floor पर visible, हमेशा accessible' },
            { icon:'📦', label:'EMPTY CARDBOARD BOXES', text:'Empty boxes की tidy, designated storage — random floor पर नहीं' },
            { icon:'🏗️', label:'AIR RECEIVER-2 (Yellow Floor Marking)', text:'Air Receiver tank के चारों तरफ yellow floor marking — safe zone clearly defined' },
          ],
          rule:'💡 Man Power 5S का real result — बिना पूछे, बिना खोजे, हर चीज अपनी जगह मिलती है। यही world class shop floor होता है!'
        }
      },
      {
        id:'gsa8', title:'Air Receiver Tank — Pressure Vessel Safety Certificate (PV-02)',
        desc:'Man Power का Air Receiver Tank-2 — certificate details, safe working pressure, और inspection awareness।',
        date:'16.02.2024', sop:'Factory Act Rule 61 — Form No. 8', audio:false, video:false, live:false,
        content:{
          category:'⚙️ Pressure Vessel Safety — Air Receiver 2 (2000 Ltrs)',
          points:[
            { icon:'📋', label:'Equipment Details', text:'Vertical Pressure Vessel | Capacity: 2000 Litres | ID: S No PV-02 | Location: Metalliser Area (Closed Shed)' },
            { icon:'🏭', label:'Make & Age', text:'Manufacturer: LPS Services | Built: 2021 | In use since: 2022 | Wall thickness: 8mm shell' },
            { icon:'🔴', label:'Safe Working Pressure', text:'Maximum: 7.0 Kg/cm² — इससे ज्यादा pressure = DANGER! Safety valve automatically release करती है।' },
            { icon:'🔍', label:'Test Done', text:'Hydrostatic test at 10.5 Kg/cm² + External & NDT Test — By Er. Praveen Kr. Singh on 18.08.2023' },
            { icon:'✅', label:'Condition (Feb 2024)', text:'Good Condition | Safety valve: Normal | Pressure gauge: Normal | Drain cock: Normal | All accessible' },
            { icon:'📅', label:'Certificate Due Date', text:'Next due: 14.08.2025 — Certificate renew होना चाहिए था। Check karo current status!' },
            { icon:'⚠️', label:'Operator Must Know', text:'Air receiver के पास: pressure gauge regularly देखो | hissing sound = तुरंत supervisor बताओ | drain valve weekly खोलो (moisture निकालने के लिए)' },
          ],
          rule:'🔴 Pressure vessel का valid test certificate = LEGAL REQUIREMENT under Factory Act. Expired certificate = Plant can be SHUT DOWN!'
        }
      },
      {
        id:'gsa3', title:'Operator Instructions — Daily Discipline (Instruction.docx)',
        desc:'सभी MET Operators के लिए mandatory daily instructions।',
        date:'2025', sop:'Internal Instruction', audio:false, video:false, live:false,
        content:{
          category:'📋 Daily Operator Checklist',
          points:[
            { icon:'⏰', label:'1. Shift Schedule', text:'Shift schedule का सख्ती से पालन करें — late आना या जल्दी जाना बर्दाश्त नहीं' },
            { icon:'🧹', label:'2. Area Cleaning', text:'Area cleaning सही तरीके से करें — random नहीं, method से' },
            { icon:'✨', label:'3. 5S Maintain', text:'5S को maintain रखें — Set in Order, Shine, Standardize daily' },
            { icon:'🔧', label:'4. Chamber Track', text:'Chamber track की अच्छी तरह सफाई करें — हर shift' },
            { icon:'🗑️', label:'5. Aluminum Dust', text:'Aluminum dust bags में भरी हो — खुले में नहीं छोड़ें' },
            { icon:'⚠️', label:'6. Loose Blade', text:'कोई भी loose blade कार्यक्षेत्र में नहीं छोड़ें — safety risk!' },
            { icon:'📦', label:'7. Paper Boxes', text:'खाली paper boxes व्यवस्थित रखें — जहाँ-तहाँ नहीं' },
          ],
          rule:'⚠️ Shift में कोई anomaly पाई गई तो उस time का operator RESPONSIBLE होगा!'
        }
      },
      {
        id:'gsa4', title:'Scrap Metal Piece in Potli — Serious Incident (TNG25001)',
        desc:'Scrap potli में metal piece मिलना — Man Power का real serious incident और lesson।',
        date:'20.02.2025', sop:'TNG25001', audio:false, video:false, live:false,
        content:{
          category:'🚨 Serious Incident — Real Case',
          points:[
            { icon:'⚠️', label:'Incident', text:'Scrap "पोटली" में एक Metal Piece पाया गया जो Slitter team ने Metalliser dept से Recycle Plant में भेजा था' },
            { icon:'🔴', label:'Why Serious', text:'Metal piece recycle plant तक जाना = major safety और quality failure. यह गंभीर लापरवाही है।' },
            { icon:'👥', label:'People Involved', text:'Arvind, Sanjay, Suraj & Sagar — सभी को warning दी गई, NCR भरी गई' },
            { icon:'✅', label:'Corrective Action', text:'सभी को inform किया गया। Future में होने पर strict action लिया जाएगा।' },
            { icon:'📋', label:'Lesson', text:'हर scrap potli को dispatch से पहले check करो — metal piece, blade, या कोई भी solid object नहीं होना चाहिए' },
          ],
          rule:'🔴 Scrap भेजने से पहले manual inspection MANDATORY है। कोई shortcut नहीं!'
        }
      },
    ]
  },

  sample_sop: {
    name:'SOPs & Rules', icon:'📋', color:'#8b5cf6', isFree:true,
    subtitle:'Man Power के actual SOPs और real rules — जो daily follow करने हैं',
    sample:true,
    lessons:[
      {
        id:'gso1', title:'Metalliser Waste Rule — Stop Diameter (TN2602)',
        desc:'Core end पर waste कितना चल सकता है — rule और accountability।',
        date:'2025', sop:'MET Waste SOP', audio:false, video:false, live:false,
        content:{
          category:'📏 Stop Diameter Rule',
          points:[
            { icon:'📏', label:'The Rule', text:'Core End पर Stop Diameter = Core OD से MAXIMUM 5mm ज्यादा' },
            { icon:'✅', label:'Meaning', text:'Core OD = 100mm → Stop Diameter maximum 105mm। इससे ज्यादा = waste!' },
            { icon:'⚠️', label:'Accountability', text:'अगर इस limit से ज्यादा Stop Diameter set किया और extra wastage हुई — संबंधित Operator RESPONSIBLE' },
            { icon:'💡', label:'Why', text:'Core end waste = usable film loss = direct cost। Small discipline = big savings।' },
            { icon:'🔍', label:'Verification', text:'Shift Incharge को हर roll का Stop Diameter verify करना चाहिए' },
          ],
          rule:'📌 Rule: Stop Diameter ≤ (Core OD + 5mm). कोई exception नहीं!'
        }
      },
      {
        id:'gso2', title:'Slitter Waste — Core End Rule',
        desc:'Core end पर waste काटने से पहले Shift Incharge को दिखाना mandatory।',
        date:'2025', sop:'Slitter Waste SOP', audio:false, video:false, live:false,
        content:{
          category:'✂️ Slitter Waste Rule',
          points:[
            { icon:'🔴', label:'Rule 1', text:'Core End पर कोई भी waste/scrap काटने से पहले — Shift Incharge को दिखाना MANDATORY' },
            { icon:'📝', label:'Rule 2', text:'जिस operator ने वो roll बनाया उसका नाम clearly लिखा जाएगा' },
            { icon:'🚫', label:'Rule 3', text:'बिना जानकारी और अनुमति के कोई भी Core End Waste Scrap नहीं किया जाएगा' },
            { icon:'👥', label:'Responsibility', text:'सभी Slitter Operators इस निर्देश का सख्ती से पालन करें' },
            { icon:'💡', label:'Why', text:'Unauthorized scrap = potential loss of good material. Incharge की नजर जरूरी है।' },
          ],
          rule:'⚠️ Slitter Core End Waste = Shift Incharge Approval पहले, action बाद में!'
        }
      },
      {
        id:'gso3', title:'Roll Movement — MIGO, 309 & 311 (TN-06)',
        desc:'FG01 से JT01 roll movement — MIGO T-Code, movement types, और cancellation।',
        date:'16.10.2025', sop:'Roll Movement OJT', audio:false, video:false, live:false,
        content:{
          category:'🔄 SAP Roll Movement',
          points:[
            { icon:'💻', label:'T-Code', text:'MIGO — Material Goods Movement T-Code। यहाँ से movement करते हैं।' },
            { icon:'311', label:'Movement 311', text:'Storage Location to Storage Location transfer — सामान्य roll movement' },
            { icon:'309', label:'Movement 309', text:'Batch-to-Batch transfer — जब batch change करनी हो' },
            { icon:'🔄', label:'CORS', text:'CORS — Cancellation of Wrong Batch। गलत batch cancel करने के लिए।' },
            { icon:'⚠️', label:'Real Case', text:'GOC2520372 — FG01 से JT01 गलत move हुआ। CORS से cancel करना पड़ा।' },
            { icon:'📍', label:'Storage Locations', text:'जानो कौन से locations हैं — FG01, JT01, आदि। गलत location = confusion' },
          ],
          rule:'📌 Roll movement से पहले: Source location + Destination + Batch — तीनों verify करो!'
        }
      },
      {
        id:'gso4', title:'Slitter Logbook — Maintaining Instructions (TN2604)',
        desc:'Slitter Logbook के columns, average speed calculation, and setup time recording।',
        date:'22.01.2025', sop:'MET F 02 Logbook', audio:false, video:false, live:false,
        content:{
          category:'📒 Logbook Maintenance',
          points:[
            { icon:'📒', label:'MET F 02', text:'Slitter Logbook format — MET F 02। सभी columns ध्यान से भरो।' },
            { icon:'⚡', label:'Average Speed Formula', text:'Average Speed = Length ÷ Time। Length मीटर में, Time minutes में।' },
            { icon:'⏱️', label:'Setup Time', text:'Setup Time = Machine Stop से Machine Start तक का time। इसे accurately record करो।' },
            { icon:'✅', label:'Every Column', text:'कोई भी column blank मत छोड़ो — incomplete logbook = accountability issue' },
            { icon:'💡', label:'Why Logbook Matters', text:'Logbook = SAP entry का base। गलत logbook = गलत SAP = गलत data!' },
          ],
          rule:'📌 Logbook में accuracy = SAP में accuracy = सही production data!'
        }
      },
      {
        id:'gso5', title:'Bare Film Joint — Must Mention in Roll Number (TN2607)',
        desc:'Roll में bare film joint होने पर roll number में mention करना mandatory।',
        date:'05.02.2026', sop:'Logbook Column', audio:false, video:false, live:false,
        content:{
          category:'🔗 Bare Joint Recording',
          points:[
            { icon:'⚠️', label:'Incident', text:'Roll No GMA26B0006 में bare film joint था पर roll number में mention नहीं किया गया' },
            { icon:'❌', label:'Problem', text:'Joint mention न होने से slitter operator को पता नहीं — unexpected web break हो सकता है' },
            { icon:'✅', label:'Rule', text:'Bare film joint होने पर logbook के Joint column में clearly mention करो' },
            { icon:'📝', label:'How to Record', text:'Roll Number के साथ "J" या "Joint" notation — जैसे GMA26B0006-J' },
            { icon:'💡', label:'Why Critical', text:'Next process (slitting) operator को advance में पता होना चाहिए — उसी के according tension adjust करेगा' },
          ],
          rule:'📌 Bare joint = Logbook में mandatory entry। अगली shift/machine को alert!'
        }
      },
      {
        id:'gso6', title:'Small Roll ID Stickers — Inside Core at Both Ends (TN2615)',
        desc:'हर slit roll में core के दोनों ends पर sticker लगाना responsibility।',
        date:'2026', sop:'TN2615', audio:false, video:false, live:false,
        content:{
          category:'🏷️ Roll Identification',
          points:[
            { icon:'🏷️', label:'Rule', text:'हर slit roll के Core के DONO ENDS पर small Roll ID sticker लगाना mandatory' },
            { icon:'👤', label:'Responsibility — Supervisor', text:'Mr. Gurpreet, Mr. Manjeet, Mr. Mohit — Shift Supervisors verify करेंगे' },
            { icon:'✅', label:'Verification — Machine Wise', text:'Sanjay/Arif/Parvez (S1) | Ishwar/Vinod/Dharambir (S1/S2) | Hariom/Harisharan (S2)' },
            { icon:'❌', label:'Consequence', text:'Sticker missing = Roll untraceable = Customer complaint risk' },
            { icon:'💡', label:'Why Both Ends', text:'एक end damage हो जाए तो दूसरी side से identify हो सके — traceability 100%' },
          ],
          rule:'📌 Sticker दोनों ends पर — हर roll पर — हर shift में। Zero compromise!'
        }
      },
      {
        id:'gso7', title:'Shift Handover Rules (TNG25004)',
        desc:'Shift changeover के दौरान mandatory rules — कोई excuse नहीं।',
        date:'13.06.2025', sop:'TNG25004', audio:false, video:false, live:false,
        content:{
          category:'🔄 Shift Changeover Rules',
          points:[
            { icon:'✂️', label:'End Roll Rule', text:'Shift timing में unload हुआ कोई भी End Roll उसी shift में काटा और scrap किया जाए' },
            { icon:'🚶', label:'Reliever Rule', text:'कोई भी plant नहीं छोड़ेगा जब तक Reliever machine पर न पहुंचे — NO EXCEPTION' },
            { icon:'🧵', label:'Wire Spool Handover', text:'हर machine पर Wire Spool handover — 15 Spools unwrapped और unpacked होने चाहिए' },
            { icon:'✨', label:'5S Round', text:'दोनों shifts मिलकर round लें shift changeover के समय — together inspection' },
            { icon:'🔵', label:'Core Ready', text:'Size changeover के दौरान Rewinder के लिए Core ready होनी चाहिए — priority: Steel Core' },
          ],
          rule:'⚠️ I do not see instructions being followed — disciplinary action will be taken!'
        }
      },
      {
        id:'gso8', title:'Jayesh Customer — Special OD Requirement (TNG25005)',
        desc:'Critical customer M/S Jayesh के लिए below target OD — edge to edge requirement।',
        date:'18.08.2025', sop:'TNG25005', audio:false, video:false, live:false,
        content:{
          category:'🎯 Critical Customer — M/S Jayesh',
          points:[
            { icon:'⭐', label:'Special Instruction', text:'Jayesh के लिए Below Target OD required है — Edge to Edge uniform होनी चाहिए' },
            { icon:'📊', label:'OD Table', text:'Customer needs 2.2 OD → Metalliser must produce 2.5 | Customer 2.5 → Met produces 2.8 | Customer 2.8 → Met produces 3.1' },
            { icon:'🎯', label:'Why Higher', text:'Slitting में OD थोड़ी reduce होती है — इसलिए Met पर ज्यादा OD रखनी पड़ती है' },
            { icon:'⚠️', label:'Edge to Edge', text:'सिर्फ center में OD match नहीं — full width edge to edge uniform होनी चाहिए' },
            { icon:'👤', label:'Operator Awareness', text:'सभी operators को यह instruction पता होनी चाहिए — sign किया था उन्होंने' },
          ],
          rule:'📌 Jayesh Order = Special handling. Standard OD नहीं चलेगा — customer requirement first!'
        }
      },
    ]
  },

  sample_skills: {
    name:'Skills & Calculations', icon:'🧮', color:'#10b981', isFree:true,
    subtitle:'PET Roll Weight formula, Excel skills, Jumbo Movement — practical daily skills',
    sample:true,
    lessons:[
      {
        id:'gsk1', title:'PET Roll Weight Calculation (TN-25)',
        desc:'Roll का weight formula — Length, Width, Micron, और Density से weight निकालो।',
        date:'08.01.2025', sop:'TN-25', audio:false, video:false, live:false,
        content:{
          category:'🧮 PET Roll Weight Formula',
          points:[
            { icon:'📐', label:'Formula — Weight', text:'Weight (kg) = Length(m) × Width(mm) × Thickness(μ) × 1.4 ÷ 1,000,000' },
            { icon:'📏', label:'Formula — Length', text:'Length (m) = Weight(kg) × 1,000,000 ÷ (Width(mm) × Micron × 1.4)' },
            { icon:'📊', label:'Formula — Width', text:'Width (mm) = Weight(kg) × 1,000,000 ÷ (Length(m) × Micron × 1.4)' },
            { icon:'💡', label:'Density Factor', text:'1.4 = PET film की density (g/cm³)। यह fixed value है।' },
            { icon:'✏️', label:'Example', text:'Roll 5000m × 1200mm × 12μ × 1.4 ÷ 1,000,000 = 100.8 kg' },
          ],
          rule:'📌 यह formula daily use होता है — याद करो और verify करो! Training में सभी को खुद calculate करना था।'
        }
      },
      {
        id:'gsk2', title:'Excel Skills — SUMIF, IF, VLOOKUP, Pivot (TN-26 & TN2613)',
        desc:'Daily reporting के लिए Excel formulas — SUMIF, IF, VLOOKUP, Pivot Table।',
        date:'11.01.2025 & 05.02.2026', sop:'TN-26', audio:false, video:false, live:false,
        content:{
          category:'📊 Excel Formulas for Production Reporting',
          points:[
            { icon:'📊', label:'SUMIF Formula', text:'=SUMIF(range, criteria, sum_range) — Example: Shift D का total production → =SUMIF(B:B,"D",C:C)' },
            { icon:'🔀', label:'IF Formula', text:'=IF(condition, true_value, false_value) — Example: =IF(OD>2.5,"OK","Recheck")' },
            { icon:'🔍', label:'VLOOKUP Formula', text:'=VLOOKUP(lookup_value, table_array, col_index, 0) — Roll number से details find करो' },
            { icon:'📈', label:'Pivot Table', text:'Data select करो → Insert → Pivot Table → Rows, Columns, Values drag करो → Analysis ready!' },
            { icon:'💡', label:'Use Case', text:'Daily Slitting & Met Jumbo report में SUMIF और IF use होते हैं — automated reporting बनती है' },
          ],
          rule:'📌 Excel सीखना = reporting fast + accurate। Manual calculation में गलती होती है — formula में नहीं!'
        }
      },
      {
        id:'gsk3', title:'Jumbo Roll Movement — Core Plug Rule (TN2601)',
        desc:'Bare और Met Jumbo को सही तरीके से move करना — Core Plug mandatory।',
        date:'20.01.2025', sop:'TN2601', audio:false, video:false, live:false,
        content:{
          category:'🏗️ Jumbo Roll Movement',
          points:[
            { icon:'💰', label:'Core Value', text:'एक 8" Core की कीमत = ₹1 LAKH per piece। Damaged core = huge loss!' },
            { icon:'🚫', label:'Wrong Practice', text:'Core Plug के बिना crane से roll उठाना — core damage होती है' },
            { icon:'✅', label:'Correct Practice', text:'हमेशा Core Plug लगाकर roll उठाओ — no exception' },
            { icon:'⚠️', label:'Damaged Core', text:'Bina plug उठाने से core dent/bent हो जाती है — फिर roll के production में crease आती है' },
            { icon:'🔍', label:'Before Lifting', text:'Check: Core plug inserted? Crane hook secure? Clear path? जब सब OK तब lift' },
          ],
          rule:'📌 Core Plug के बिना Crane Lifting = STRICTLY NOT ALLOWED!'
        }
      },
      {
        id:'gsk4', title:'Slitting as per Planning — Roles & Priority (TN2605)',
        desc:'Planning के हिसाब से slitting — Coating Material priority, Normal SAP order।',
        date:'28.01.2025', sop:'MET F 01 Logbook', audio:false, video:false, live:false,
        content:{
          category:'📅 Slitting Priority Rules',
          points:[
            { icon:'1️⃣', label:'Priority 1 — Coating Material', text:'Coating department का material सबसे पहले slit होगा — urgent/priority basis' },
            { icon:'2️⃣', label:'Priority 2 — Special Sample', text:'Special sample production — customer/quality requirement' },
            { icon:'3️⃣', label:'Priority 3 — Normal SAP', text:'Normal planning as per SAP order — regular production' },
            { icon:'✅', label:'Before Slitting', text:'Order check: Micron ✓ | OD ✓ | Size/Width ✓ — तीनों verify करो। TN-04 से lesson!' },
            { icon:'⚠️', label:'Real Incident', text:'Wrong order check से 3.3 MT B-Grade material बना — TN-04 (14.10.2025)' },
          ],
          rule:'📌 Planning से बाहर slitting = supervisor की permission जरूरी। खुद decision मत लो!'
        }
      },
      {
        id:'gsk5', title:'Aluminum Core — Why Only Aluminum for Heavy Rolls (TN2603)',
        desc:'Metalliser में aluminum cores क्यों जरूरी हैं और selection criteria।',
        date:'21.01.2025', sop:'TN2603', audio:false, video:false, live:false,
        content:{
          category:'⚙️ Core Knowledge',
          points:[
            { icon:'🔵', label:'Aluminum Core Advantage', text:'Aluminum cores stronger होते हैं heavy rolls (>2200 kg) के लिए — deflection नहीं होती' },
            { icon:'⚠️', label:'Paper Core Risk', text:'Heavy roll में paper core use = core bend/collapse = roll damage + machine issue' },
            { icon:'📏', label:'Core Thickness', text:'Light rolls (<2200 kg) के लिए minimum 14mm wall thickness वाली core — good condition में' },
            { icon:'📐', label:'Core Extension', text:'>3000 kg rolls में core दोनों sides से 50mm से ज्यादा बाहर नहीं निकलनी चाहिए' },
            { icon:'NCR', label:'NCR 26-5', text:'26.01.2026 — Paper Core used in Roll 2400 Kgs → NCR raised on ANUJ' },
          ],
          rule:'📌 Heavy roll = Aluminum Core only. यह SOP है, rule है, और safety है!'
        }
      },
    ]
  },


  sample_maintenance: {
    name:'PM & Maintenance', icon:'🔧', color:'#38bdf8', isFree:true,
    subtitle:'Metalliser का Daily/Weekly/Monthly PM — Oil types, Boat testing, Cleaning record',
    sample:true,
    lessons:[
      {
        id:'gm1', title:'Daily PM Checklist — हर shift में क्या check करें (MET F-07)',
        desc:'Mechanical Booster Pumps, Vacuum O-Rings, Chiller — daily inspection points.',
        date:'Effective: 01.06.2022', sop:'MET/F/07', audio:false, video:false, live:false,
        content:{
          category:'📋 Daily PM — Process Team (दैनिक निरीक्षण)',
          points:[
            { icon:'🔵', label:'1. Mech. Booster Pumps — Gear Case Oil', text:'पंप बंद होने पर Gear Case सिरे पर Oil Level check करें — label देखो। Excess loss = तुरंत report करो।' },
            { icon:'🔵', label:'2. Mech. Booster Pumps — Drive Case Oil', text:'Drive Case सिरे का oil level check करना है — label के अनुसार। पंप बंद हो तो ही check करें।' },
            { icon:'💧', label:'3. Water Line Leakage', text:'Drive Motor Case की water lines में leakage check — मिले तो तुरंत repair करो।' },
            { icon:'🔍', label:'4. CM2000 Booster Pump Filter', text:'CM2000 Booster का Inlet Filter clean करो — manual के cleaning section के according।' },
            { icon:'⭕', label:'5. O-Ring Condition', text:'Main Faceplate से Chamber O-Ring की damage check करो — जरूरत पड़े तो repair या replace करो।' },
            { icon:'🌡️', label:'6. GRE Chiller Unit', text:'बाहर से water leakage check करो — 48KW to 96KW models। रोज़ाना inspection mandatory।' },
          ],
          rule:'Daily PM = Breakdown prevention. आज की जांच = कल की production!'
        }
      },
      {
        id:'gm2', title:'Weekly PM Checklist — हर हफ्ते क्या करें (MET F-08)',
        desc:'Diffusion Pumps, O-Ring cleaning, Cryo-Generator temperature and pressure.',
        date:'Effective: 01.06.2022', sop:'MET/F/08', audio:false, video:false, live:false,
        content:{
          category:'📋 Weekly PM — Process Team (साप्ताहिक)',
          points:[
            { icon:'💧', label:'1. Varian Diffusion Pumps — Water Leakage', text:'सभी hoses में water leakage check करो — weekly basis पर।' },
            { icon:'🛢️', label:'2. Diffusion Pump Oil', text:'Oil level और color check करो — गंदा oil = तुरंत बदलो। साफ oil = good production।' },
            { icon:'📏', label:'3. Pump Fluid Level', text:'Pump fluid COLD या HOT marker पर होना चाहिए — site glass से verify करो।' },
            { icon:'⭕', label:'4. O-Ring Cleaning and Greasing', text:'Main Faceplate से Chamber तक O-Ring surface clean करो और re-grease करो।' },
            { icon:'🌡️', label:'5. Cryo-Generator Temperature', text:'Brookes Maxcool Mk 2 — process के दौरान temperature check करो और LCD panel की value record करो।' },
            { icon:'💨', label:'6. Cryo-Generator Gas Pressure', text:'Gas pressure और discharge check करो — LCD panel पर record करो। Weekly documented होनी चाहिए।' },
          ],
          rule:'Weekly PM = Weekly record. बिना record के PM नहीं माना जाएगा!'
        }
      },
      {
        id:'gm3', title:'Monthly PM Checklist (MET F-09)',
        desc:'Diffusion pump fluid, Cryo coil cooling time, Winch gearbox oil — monthly checks.',
        date:'Effective: 01.06.2022', sop:'MET/F/09', audio:false, video:false, live:false,
        content:{
          category:'📋 Monthly PM — Process Team (मासिक)',
          points:[
            { icon:'🛢️', label:'1. Diffusion Pump Fluid', text:'Pump fluid level COLD या HOT mark पर है — site glass से check करो।' },
            { icon:'🔴', label:'2. Corrosion Check', text:'Diffusion pump पर बाहरी जंग देखो — Due Point से कम water supply का संकेत। Temperature control करो।' },
            { icon:'🔩', label:'3. VV7 Valve Plates', text:'VV7 Valve Plates खोलो, inspect करो, O-Ring से debris साफ करो, फिर re-grease करो।' },
            { icon:'❄️', label:'4. Cryo Coil Cooling Time', text:'Cryo coil को ठंडा होने में लगने वाला time record करो — comparison के लिए। बढ़ता time = issue।' },
            { icon:'🔧', label:'5. Spool Valves', text:'Vacuum chamber के सभी Spool Valves की correct operation check करो।' },
            { icon:'🛢️', label:'6. Winch Gearbox Oil', text:'Coating Shield और Shutter winch gearbox में oil level जांचो — Anderol 555 भरो जरूरत पर।' },
          ],
          rule:'Monthly PM sign = HOD countersign mandatory. बिना sign अधूरा माना जाएगा!'
        }
      },
      {
        id:'gm4', title:'Quarterly/Annual Oil Change Schedule (MET F-10 and F-11)',
        desc:'Oil and Coolant replacement schedule — Met-1 और Met-2 दोनों के लिए।',
        date:'Rev. Date: 07.02.2026', sop:'MET/F/10 and MET/F/11', audio:false, video:false, live:false,
        content:{
          category:'🛢️ Oil and Coolant Replacement Schedule',
          points:[
            { icon:'1️⃣', label:'Aerzen Booster Pumps — Anderol 555', text:'Met-1: Last done 25-Sep-25, Next due: 24-Mar-26 OK\nMet-2: Last done 31-Jul-23 — OVERDUE! Action needed.' },
            { icon:'2️⃣', label:'Busch Dry Pumps — Oil (Anderol 555)', text:'Met-1: 25-Sep-25 OK | Met-2: 05-Sep-25 OK. Annual frequency.' },
            { icon:'3️⃣', label:'Busch Dry Pumps — Coolant', text:'40% Glycol + 60% DM Water | Every 5000 Hours\nMet-1: 21-Jan-26 OK | Met-2: 05-Sep-25, Next: 04-Mar-26' },
            { icon:'4️⃣', label:'Diffusion Pumps — Bobst CVC Silicone 4', text:'Met-1: 14-Sep-23 — OVERDUE! | Met-2: 03-Sep-25, Next: 03-Sep-26 OK' },
            { icon:'5️⃣', label:'Winding Cart Gearbox — BP Energol GR-XP 220', text:'Both Met-1 and Met-2: OVERDUE — HOD को report करो immediately!' },
            { icon:'6️⃣', label:'Drum Leadthrough — Castrol Hyspin AWS 10', text:'As needed (Removal/Strip Down). Track when done. Current: NA' },
          ],
          rule:'OVERDUE items को तुरंत HOD को report करो — delayed oil change = pump failure risk!'
        }
      },
      {
        id:'gm5', title:'Evaporator Boat Life Testing — TOMOE Trial (MET F-06)',
        desc:'Boat life testing trial — TOMOE vs current boats, real data from Met-2.',
        date:'23 December 2025', sop:'MET/F/06', audio:false, video:false, live:false,
        content:{
          category:'⚗️ Boat Life Trial — Real Data (Met-2)',
          points:[
            { icon:'🏭', label:'Trial Setup', text:'Machine: Met-2 | Supplier: TOMOE Eng. Co. Ltd. | Boat: Di-Met 125x38x9.5mm\nOperators: Shivam, Surya, Neeraj | Supervisors: Anuj, Ghanshyam' },
            { icon:'📊', label:'Process Parameters', text:'Speed: 700-850 m/min | Width: 3290-3370mm | Wire Dia: 2.2mm\nWire Feed: 78-95 cm/min | Current: 713-725A | Vacuum: 1x10^-5 to 1.4x10^-4 mbar' },
            { icon:'📈', label:'OD and Quality', text:'OD Range: 2.3-2.6 | Evaporation: Stable | Metal Uniformity: Good | Spitting: None' },
            { icon:'💥', label:'Boat Damage Pattern', text:'After Cycle 6: 10 Boats damaged | After Cycle 7: 16 more | After Cycle 8: 20 more — cumulative pattern.' },
            { icon:'✅', label:'Conclusion', text:'TOMOE boats = EQUALLY GOOD vs current boats. If cost advantage available — recommended.' },
          ],
          rule:'Boat trial data = documented record रखो। Cost + life दोनों compare करके HOD को report करो।'
        }
      },
      {
        id:'gm6', title:'Machine and Floor Cleaning Record (F-PRD-03)',
        desc:'Daily और Weekly cleaning schedule — कौन-कौन सी चीजें clean करनी हैं।',
        date:'Effective: 01.06.2022', sop:'F-PRD-03', audio:false, video:false, live:false,
        content:{
          category:'🧹 Cleaning Schedule — Met and Slitter Area',
          points:[
            { icon:'📅', label:'Daily Cleaning', text:'1. Metallizer Floor\n2. Slitter Floor\n3. Metallizer Frame\n4. Slitter Frame\n5. Operating Panels' },
            { icon:'📅', label:'Weekly Cleaning', text:'6. Trim Conveying Units\n7. Roll Stand\n8. Roll Conveyors' },
            { icon:'✍️', label:'Zone Incharge Sign', text:'हर entry पर Zone Incharge का signature mandatory है।' },
            { icon:'💡', label:'Why Important', text:'Clean machine = less defects. Dirty frame/panel = quality issues और audit failure.' },
            { icon:'📋', label:'Format Info', text:'Doc No: F-PRD-03. Monthly record separate sheet में. Status: check mark or cross.' },
          ],
          rule:'Cleaning record without Zone Incharge sign = invalid. हर entry complete होनी चाहिए!'
        }
      },
    ]
  },

  sample_formats: {
    name:'Formats and Logbooks', icon:'📒', color:'#a3e635', isFree:true,
    subtitle:'Man Power के सभी formats — क्या भरें, कैसे भरें, कौन responsible है',
    sample:true,
    lessons:[
      {
        id:'gf1', title:'Metallizer Log Book — MET F/01',
        desc:'Metallizer Log Book के सभी columns — क्या record करना है हर cycle में।',
        date:'Format: MET/F/01', sop:'MET/F/01', audio:false, video:false, live:false,
        content:{
          category:'📒 MET F/01 — Metallizer Log Book Columns',
          points:[
            { icon:'📊', label:'Header Info', text:'Today Production | Cumulative Production | AVG Vacuum Time | AVG M/C Speed | AVG Width | AVG RCO | No. of Rolls | Additional Cycle | New Boat | AL Wire' },
            { icon:'⏱️', label:'Process Down Time', text:'FROM | TO | TOTAL | REASON — हर downtime accurately record करो' },
            { icon:'🔄', label:'Cycle Timing', text:'Vacuum Start/Time | Heating Start/Time | Web Start Time | M/c Stop Time | Vent Time' },
            { icon:'⚙️', label:'Process Parameters', text:'Chiller Temp | U/T | R/T | Drum Torque | DTR1/DTR2 Torque | Rewind Spreader | Drum Spreader' },
            { icon:'🛢️', label:'Pump Oil Level', text:'BP1-BP5 (Booster) | RP1-RP3 (Rotary) | DP1-DP3 (Diffusion) — OK / NOT OK / Remarks' },
            { icon:'⚗️', label:'Polycold and Waste', text:'PC1/PC2/PC3: Suction and Discharge | WASTE: Bare Waste and AL Scrap (kg)' },
          ],
          rule:'Logbook = Production record. Shift Incharge Sign + HOD Sign दोनों mandatory हर page पर!'
        }
      },
      {
        id:'gf2', title:'Met Slitter Log Book — MET F/02',
        desc:'Slitter Log Book के Input/Output columns और shift performance tracking।',
        date:'Format: MET/F/02', sop:'MET/F/02', audio:false, video:false, live:false,
        content:{
          category:'📒 MET F/02 — Met Slitter Log Book',
          points:[
            { icon:'📥', label:'Input Details', text:'Material | Bare Jumbo No. | Met Jumbo No. | Jumbo Width(MM) | Jumbo Length(MTR) | Weight(KGS)' },
            { icon:'📤', label:'Output Details', text:'Batch No. | Width(MM) | Length(MTR) | Core Id(Inch) | Roll Position | Joint From Top | Met Side(I/O) | Gross/Net Wt(KG) | Grade | Remarks' },
            { icon:'⏱️', label:'Shift Performance', text:'Setup Time(Min) | Running Time(Min) | Avg Speed(M/Min) | Downtime(Min) | Others(Min) | Total(Min)' },
            { icon:'⚖️', label:'Waste Record', text:'Met Waste(Kg) and Bare Waste(Kg) — हर roll का waste separately record करो' },
            { icon:'💡', label:'Critical — Met Side Column', text:'I = Inside (Operator Side) | O = Outside. यह column कभी blank नहीं — wrong side = customer complaint!' },
            { icon:'👥', label:'Signatures', text:'Supervisor + Operator + Q.C. Officer + Dept. Incharge — सब mandatory!' },
          ],
          rule:'Met Side (I/O) column को कभी blank मत छोड़ो — यह customer complaint का सबसे बड़ा reason है!'
        }
      },
      {
        id:'gf3', title:'Material Issuance Slip — MET F/03',
        desc:'Stores से material लेने का proper process — तीन signatures mandatory।',
        date:'Effective: 10.12.2025 | Issue 01', sop:'MET/F/03', audio:false, video:false, live:false,
        content:{
          category:'📝 Material Issuance Slip Process',
          points:[
            { icon:'📋', label:'Slip Details', text:'Date | Shift | S.No. | Item Name | Requirement Qty | UoM | Old Return Qty | Slip No.' },
            { icon:'✅', label:'Three Signatures Required', text:'1. Receiver (Name + Signature)\n2. Store Person (Name + Signature)\n3. HOD — Approving Authority (Name + Signature)' },
            { icon:'🔄', label:'Old Return Qty', text:'जो पुरानी item वापस करनी है उसकी qty भी लिखो — new issue से पहले old return mandatory' },
            { icon:'🎯', label:'Maximum 5 Items per Slip', text:'एक slip में maximum 5 items। ज्यादा हों तो दूसरी slip बनाओ।' },
            { icon:'⚠️', label:'Without HOD Sign', text:'HOD sign के बिना store person material नहीं देगा — यह policy है।' },
          ],
          rule:'Material Issuance Slip = Accountability document. Bina proper process ke material लेना = violation!'
        }
      },
      {
        id:'gf4', title:'Blade Record — MET F/12 (Lutz, Stanley, Olfa)',
        desc:'Daily blade consumption tracking — 4 types, daily issuance और balance।',
        date:'Effective: 01.06.2022', sop:'MET/F/12', audio:false, video:false, live:false,
        content:{
          category:'🔪 Blade Record — Daily Tracking',
          points:[
            { icon:'🔵', label:'Blade Types at Man Power', text:'1. Lutz Blade (43x22.2mm) — Main slitting blade\n2. Paper Cutter Blade\n3. Stanley Cutter 9mm\n4. Olfa Cutter Blade 25mm' },
            { icon:'📊', label:'Daily Columns', text:'Opening Stock | Issued by Store | Return to Store | Issued to M/c (Day) | Issued to M/c (Night) | Balance Stock' },
            { icon:'📈', label:'SAP Integration', text:'Movement Type 201 = Goods Issue to Cost Center in SAP. हर issuance documented = cost tracked.' },
            { icon:'🔢', label:'Replenishment', text:'Lutz blades — batches of 200-500. नीचे zero होने से पहले order करो। Lead time 2-3 days.' },
            { icon:'💡', label:'Usage Pattern', text:'Day shift: 4-10 blades/day | Night shift: 1-6 blades/day — abnormal consumption = investigate!' },
          ],
          rule:'Blade return mandatory before new issue. Used blades in box = counted properly. No loose blade on floor!'
        }
      },
      {
        id:'gf5', title:'Audit and NCR Process (Man Power GEN F-01 and F-02)',
        desc:'Internal audit kaise hota hai, observation kya hota hai, NCR kaise close hoti hai।',
        date:'Audit No. 01 — 10.01.2023', sop:'MET/GEN/F/01 and F/02', audio:false, video:false, live:false,
        content:{
          category:'🔍 Audit and NCR Process',
          points:[
            { icon:'🔍', label:'Audit Observation Sheet', text:'Audit No. | Date | Department | Auditee | Observations | Clause | Remark (O+ve/M/m/OI)' },
            { icon:'📝', label:'Remark Types', text:'O+ve = Positive | M = Major NC | m = Minor NC | OI = Opportunity for Improvement' },
            { icon:'⚠️', label:'Real Example (10.01.2023)', text:'Observation: Hand over check sheet not available after PM of machine. Remark: OI' },
            { icon:'📋', label:'NCR Corrective Action Format', text:'NC Details + Correction + Root Cause + Corrective Action + Responsibility + Target Date' },
            { icon:'🎯', label:'Root Cause Thinking', text:'Root cause identify karo → Action lo → Target date fix karo → Close with evidence' },
          ],
          rule:'NCR raised = positive! Improvement ka chance hai. Hide mat karo — address karo aur close karo!'
        }
      },
      {
        id:'gf6', title:'Complete Man Power MET Document Master List (MET/ML/01)',
        desc:'Department SOPs, Work Instructions, and Formats list.',
        date:'Rev. Date: 07.02.2026 | Issue 01', sop:'MET/ML/01', audio:false, video:false, live:false,
        content:{
          category:'📚 Master List — All Man Power MET Documents',
          points:[
            { icon:'📋', label:'SOPs (10 total)', text:'SOP/01: Flow Chart | SOP/02: Jumbo Movement | SOP/03: Operating Parameters | SOP/06: OD Set | SOP/07: Stop Diameter | SOP/09: Slitting Ripple Free | SOP/10: Al Dust Disposal' },
            { icon:'🔧', label:'WI — Metalliser (01 to 26)', text:'Startup, Shutdown, Bare Film Selection, Boat Change, Moving Parts Safety, Drum/Shield Cleaning, Film Threading, Roll Loading, Quality Inspection, AlOx Handling, Met Waste Reduction, SAP Entry' },
            { icon:'✂️', label:'WI — Slitter (01 to 10)', text:'Roll Selection, Machine Setup, Blade Change, Core Receiving, Joint Formation, Slitting Start, Roll Unloading, Data Entry, Supervisor Responsibilities, SAP Entry' },
            { icon:'📒', label:'Formats (F/01 to F/12)', text:'F/01: Met Logbook | F/02: Slitter Logbook | F/03: Issuance Slip | F/04-05: Planning | F/06: Boat Trial | F/07-11: PM Checklists | F/12: Blade Record' },
            { icon:'💡', label:'Custodian and Retention', text:'Custodian = HOD. Retention = 1 Year. Effective Date: 01.06.2022. All documents controlled!' },
          ],
          rule:'यह Man Power का official document list है। इसी के according काम करना है — कोई unofficial document valid नहीं!'
        }
      },
    ]
  },

  sample_instructions: {
    name:'Manager Instructions', icon:'📢', color:'#f59e0b', isFree:false, plan:'supervisor',
    subtitle:'Vivek Sir के direct instructions — सभी के लिए binding',
    sample:true,
    lessons:[
      {
        id:'gi1', title:'Shift Schedule — No Tolerance (Instruction.docx)',
        desc:'Shift schedule strict follow करना — कोई excuse नहीं।',
        date:'2025', sop:'Internal', audio:false, video:false, live:false,
        content:{
          category:'⏰ Strict Instructions — All MET Operators',
          points:[
            { icon:'1️⃣', label:'Shift Schedule', text:'Shift schedule का सख्ती से पालन करें' },
            { icon:'2️⃣', label:'Area Cleaning', text:'Area cleaning सही तरीके से — method follow करो' },
            { icon:'3️⃣', label:'5S Maintain', text:'5S daily maintain — हर operator जिम्मेदार है अपने area का' },
            { icon:'4️⃣', label:'Chamber Track', text:'Chamber track की thorough cleaning — हर shift' },
            { icon:'5️⃣', label:'Aluminum Dust', text:'Aluminum dust = bags में। खुले में = NCR!' },
            { icon:'6️⃣', label:'Old Clothes', text:'पुरानी धोती/फटे कपड़े = Dustbin में। Area में नहीं।' },
            { icon:'7️⃣', label:'Paper Boxes', text:'खाली paper boxes = व्यवस्थित ढंग से। Random नहीं।' },
            { icon:'8️⃣', label:'Loose Blade', text:'Loose blade anywhere = ZERO TOLERANCE' },
          ],
          rule:'⚠️ शिफ्ट में कोई anomaly = उस वक्त का operator जिम्मेदार। No excuse accepted.'
        }
      },
    ]
  },
};

// ════════════════════════════════════════════════════
// CAREER BOOST — Important Q&A (3 Levels)
// ════════════════════════════════════════════════════
const CAREER_BOOST = {
  operator: {
    title: '⚙️ Operator — Level 1',
    subtitle: 'Machine · Process · Safety · Quality — अपना दम दिखाओ',
    color: '#22c55e',
    sections: [
      {
        label: '🏭 Machine Knowledge',
        questions: [
          { q: 'Vacuum Metalliser में vacuum क्यों बनाया जाता है?', a: 'Vacuum में <b>aluminium wire evaporate</b> होती है और film पर coat होती है। Vacuum न हो तो aluminium oxidize हो जाती है और coating नहीं होती। साथ ही film को oxidation से बचाने के लिए भी vacuum जरूरी है।' },
          { q: 'Metalliser machine के main parts कौन से हैं?', a: '<b>Unwinding</b> (film supply) → <b>Process Chamber</b> (vacuum + evaporation) → <b>Winding</b> (finished reel). Key parts: Evaporator boat, vacuum pumps, coating drum, tension system, dancer rollers.' },
          { q: 'Evaporator boat का क्या काम है?', a: 'Evaporator boat में <b>aluminium wire डाली जाती है</b>। High current से boat गर्म होती है और aluminium पिघलकर वाष्प बनती है जो film पर deposit होती है।' },
          { q: 'Vacuum pump कितने प्रकार के होते हैं machine में?', a: 'Rotary/mechanical pump (rough vacuum), <b>Roots pump</b> (medium vacuum), और <b>Diffusion pump या Cryo pump</b> (high vacuum) — तीनों मिलकर operating vacuum बनाते हैं।' },
          { q: 'OD (Optical Density) क्या होता है?', a: '<b>OD = coating की thickness का measure</b> है। Light transmission को measure करके OD निकालते हैं। Customer की specification के हिसाब से OD maintain करना operator की जिम्मेदारी है।' },
        ]
      },
      {
        label: '⚡ Process Parameters',
        questions: [
          { q: 'Wire feed rate का coating पर क्या effect होता है?', a: '<b>Wire feed rate बढ़ाने से OD बढ़ता है</b> (coating मोटी होती है)। कम करने से OD कम होता है। Wire rate, drum speed, और line speed तीनों मिलकर final OD तय करते हैं।' },
          { q: 'Line speed बढ़ाने पर क्या होता है?', a: '<b>Line speed बढ़ने से film कम time तक coating zone में रहती है</b> → OD कम होता है। इसलिए speed बढ़ाने के साथ wire rate भी proportionally बढ़ानी पड़ती है।' },
          { q: 'Film tension क्यों maintain करनी पड़ती है?', a: 'कम tension से <b>film wrinkling</b> होती है और ज्यादा tension से film stretch या tear हो सकती है। Proper tension से coating uniform रहती है और defects कम होते हैं।' },
          { q: 'Boat current क्या होता है और क्यों important है?', a: '<b>Boat current से aluminium का evaporation rate control</b> होता है। Current कम हो तो aluminium ठीक से evaporate नहीं होती — OD कम रहता है। ज्यादा हो तो boat burn हो सकती है।' },
        ]
      },
      {
        label: '🔴 Defects & Quality',
        questions: [
          { q: 'Pinholes defect किस वजह से आता है?', a: '<b>Aluminium wire में impurity, boat में crack, या film surface की गंदगी</b> से pinholes आते हैं। Boat की regular inspection और wire quality check से रोका जा सकता है।' },
          { q: 'Blocking defect क्या है?', a: '<b>Blocking = wound रील में film की layers आपस में चिपकना</b>। यह high temperature, high OD, या winding tension ज्यादा होने से होता है।' },
          { q: 'Streaks/lines defect क्यों आती हैं?', a: 'Boat में <b>crack या uneven heating</b> से streaks आती हैं। Dirty coating drum या roller भी streaks का कारण बन सकते हैं।' },
          { q: 'Quality check में operator क्या-क्या देखता है?', a: '<b>OD reading, visual inspection</b> (streak/pinhole/blocking), reel surface appearance, और splice check — हर roll का basic quality check operator करता है।' },
        ]
      },
      {
        label: '🛡️ Safety',
        questions: [
          { q: 'Metalliser में कौन-कौन से safety risks हैं?', a: '<b>High voltage</b> (boat current), <b>high temperature</b> (evaporator zone), <b>rotating parts</b> (winding/unwinding), और <b>chemical exposure</b> (pump oils/solvents) — सभी से सावधानी जरूरी है।' },
          { q: 'Machine चलाते समय कौन-सा PPE पहनना जरूरी है?', a: '<b>Safety shoes, hand gloves, safety glasses</b> — minimum. Hot zones के पास face shield और heat-resistant gloves, electrical work के समय insulated gloves।' },
          { q: 'Emergency stop का use कब करते हैं?', a: 'Abnormal sound, film breakage, smoke/spark, vacuum sudden drop, या कोई भी unsafe situation में <b>तुरंत E-stop दबाएं</b> और supervisor को inform करें।' },
        ]
      },
    ]
  },

  supervisor_boost: {
    title: '👷 Supervisor — Level 2',
    subtitle: 'Shift Management · Team · Reporting — Leadership दिखाओ',
    color: '#fbbf24',
    sections: [
      {
        label: '📋 Shift Management',
        questions: [
          { q: 'Shift handover में क्या-क्या बताना जरूरी है?', a: '<b>Production status, pending jobs, machine condition, manpower issues, quality concerns, और any ongoing breakdown</b> — सब clearly अगली shift को बताना supervisor की जिम्मेदारी है।' },
          { q: 'Absenteeism handle कैसे करें?', a: 'पहले <b>available manpower से critical positions cover</b> करें। HR/manager को inform करें। Backup plan ready रखें — कौन किसकी जगह काम कर सकता है यह advance में सोच के रखें।' },
          { q: 'Production target miss हो रहा हो तो क्या करें?', a: '<b>Root cause identify करें</b> (machine, manpower, material), immediate corrective action लें, manager को update दें, और log में record करें। Hide मत करें।' },
          { q: 'SOP follow न हो तो supervisor क्या करे?', a: 'पहले <b>observe, फिर coach</b> — समझाएं क्यों SOP important है। दोबारा repeat हो तो written warning की process follow करें। Zero tolerance — unsafe work at no time।' },
        ]
      },
      {
        label: '📝 Reporting & Documentation',
        questions: [
          { q: 'Shift report में क्या-क्या होना चाहिए?', a: '<b>Production output, downtime (with reason), quality issues, manpower count, machine status, pending actions</b> — एक अच्छा shift report अगली shift को बिना पूछे सब बता देता है।' },
          { q: 'NCR (Non-Conformance Report) कब बनाते हैं?', a: 'जब <b>product quality specification से बाहर हो</b> — wrong OD, excessive defects, customer complaint — NCR बनाते हैं। NCR में problem, quantity affected, root cause, और corrective action mention होता है।' },
          { q: 'Deviation report क्यों important है?', a: 'Deviation report <b>process से हटने का documented record</b> है। यह future analysis के लिए data देता है और responsibility fix करता है।' },
        ]
      },
      {
        label: '👥 Team & Communication',
        questions: [
          { q: 'Operator की performance कैसे monitor करें?', a: '<b>Output vs target, quality rejections, SOP compliance, attendance</b> — इन चारों को track करें। Regular feedback दें — सिर्फ गलती पर नहीं, अच्छे काम पर भी।' },
          { q: 'Conflict between two operators — supervisor क्या करे?', a: '<b>दोनों को अलग-अलग सुनें</b>, neutral रहें, facts देखें। Production area में dispute नहीं — break time में resolve करें। Document करें और HR को inform करें अगर serious हो।' },
          { q: 'Interdepartmental coordination क्यों जरूरी है?', a: '<b>Quality, stores, maintenance, HR</b> — सब से coordinate करना पड़ता है। Information hold करने से problems बढ़ती हैं। Proactive communication = less firefighting।' },
        ]
      },
      {
        label: '🔧 Problem Solving',
        questions: [
          { q: 'WHY-WHY analysis क्या होता है?', a: '<b>Problem का root cause निकालने का method</b> — problem को 5 बार "क्यों?" पूछो जब तक असली कारण न मिले। Example: OD कम → wire rate कम → boat खराब → PM missed → PM schedule नहीं था।' },
          { q: 'Breakdown के time supervisor का role क्या है?', a: '<b>Inform करो, isolate करो, organize करो</b> — maintenance को call, area safe रखो, production ka alternative plan बनाओ, और downtime record करो।' },
        ]
      },
    ]
  },

  manager_boost: {
    title: '🎯 Manager — Level 3',
    subtitle: 'Planning · Cost · Leadership · KPI — बड़ी सोच, बड़ा असर',
    color: '#a855f7',
    sections: [
      {
        label: '📊 Planning & Productivity',
        questions: [
          { q: 'OEE क्या है और इसे कैसे improve करते हैं?', a: '<b>OEE = Availability × Performance × Quality</b>. Improve करने के लिए: downtime कम करो (availability↑), speed losses घटाओ (performance↑), rejections कम करो (quality↑). Small consistent improvements = big OEE gains.' },
          { q: 'Daily production planning में क्या-क्या होना चाहिए?', a: '<b>Target vs actual tracking, machine allocation, manpower plan, material availability check, priority jobs list</b> — Morning meeting में यह सब 15 minutes में cover होना चाहिए।' },
          { q: 'Capacity utilization कैसे calculate करते हैं?', a: '<b>Actual output ÷ Maximum possible output × 100</b>. Low utilization के कारण: unplanned downtime, material shortage, manpower issues। यह figure management को resource allocation decide करने में help करता है।' },
          { q: 'KPI (Key Performance Indicators) क्या होते हैं?', a: '<b>Production output, OEE%, rejection rate, on-time delivery, downtime hours, cost per kg</b> — ये metrics department की performance बताते हैं। Manager इन्हें weekly/monthly track करता है।' },
        ]
      },
      {
        label: '💰 Cost Control',
        questions: [
          { q: 'Where does cost occur in your department?', a: '<b>Raw material (aluminium wire, film), energy (electricity for vacuum pumps + heating), maintenance (spares, consumables), manpower</b> — इन चारों को monitor करना cost management है।' },
          { q: 'Aluminium wire wastage कम कैसे करें?', a: '<b>OD control tight रखो</b> (over-coating = wire waste), boat life optimize करो, wire splice quality improve करो, और per-shift wire consumption track करो।' },
          { q: 'Energy cost कैसे reduce करें?', a: '<b>Machine idle time कम करो</b> (pumps always running = expensive), production scheduling optimize करो, air leaks fix करो (vacuum pumps को ज्यादा काम करना पड़ता है), और maintenance से pump efficiency maintain करो।' },
        ]
      },
      {
        label: '🌟 Leadership & People',
        questions: [
          { q: 'High-performing team कैसे बनाते हैं?', a: '<b>Right person, right job</b> → skill-based allocation. Regular feedback, recognition of good work, training opportunities, और psychological safety — लोग तभी best देते हैं जब safe feel करते हैं।' },
          { q: 'Accountability culture कैसे बनाएं?', a: '<b>Clear expectations → track करो → consequences दो</b> (positive & negative both). Lead by example — अगर manager खुद SOP follow नहीं करता तो team भी नहीं करेगी।' },
          { q: 'New employee को quickly productive कैसे बनाएं?', a: '<b>Structured onboarding: buddy system, SOP reading, supervised practice, gradual responsibility increase</b>. First 30 days critical हैं — proper induction से long-term performance improve होती है।' },
        ]
      },
      {
        label: '🤝 Cross-Functional & Systems',
        questions: [
          { q: 'Quality department के साथ manager का coordination कैसा हो?', a: '<b>Proactive communication</b> — quality complaints early share करो, joint root cause analysis करो, corrective actions timebound रखो। Quality department partner है, enemy नहीं।' },
          { q: 'MIS report क्या होती है और क्यों बनाते हैं?', a: '<b>Management Information System</b> report — production data, quality data, cost data को एक जगह summarize करती है। Management को decision लेने के लिए facts चाहिए — MIS वो देती है।' },
          { q: 'Audit के लिए department कैसे prepare करें?', a: '<b>5S maintain, documentation up-to-date, SOPs displayed and followed, team briefed on audit questions</b>. Audit surprise नहीं होना चाहिए — अगर आप daily अच्छा काम कर रहे हो तो audit ready हो।' },
        ]
      },
    ]
  }
};

let _currentBoostLevel = null;
let _boostRevealed = {};

function openCareerBoost(level){
  _currentBoostLevel = level;
  const data = CAREER_BOOST[level];
  if(!data) return;

  // Load saved revealed state
  try{
    const saved = localStorage.getItem('cb_revealed_' + level);
    _boostRevealed = saved ? JSON.parse(saved) : {};
  }catch(e){ _boostRevealed = {}; }

  // Switch views
  document.getElementById('learnMainButtons').style.display = 'none';
  document.getElementById('learnModuleView').style.display = 'none';
  document.getElementById('learnAboutView').style.display = 'none';
  document.getElementById('learnPlansSection').style.display = 'none';
  document.getElementById('careerBoostView').style.display = 'block';

  document.getElementById('careerBoostTitle').textContent = data.title;
  document.getElementById('careerBoostSub').textContent = data.subtitle;
  document.getElementById('careerProgressBar').style.background = `linear-gradient(90deg,${data.color},#38bdf8)`;

  renderCareerBoost(data);
  updateBoostProgress(data);
}

function closeCareerBoost(){
  _currentBoostLevel = null;
  document.getElementById('careerBoostView').style.display = 'none';
  document.getElementById('learnMainButtons').style.display = 'block';
}

function renderCareerBoost(data){
  const list = document.getElementById('careerBoostList');
  if(!list) return;
  let html = '';
  let qIndex = 0;
  data.sections.forEach(sec => {
    html += `<div class="cb-section-hdr">${sec.label}</div>`;
    sec.questions.forEach(q => {
      const key = 'q' + qIndex;
      const revealed = !!_boostRevealed[key];
      html += `<div class="cb-card${revealed?' revealed':''}" id="cbcard_${_currentBoostLevel}_${qIndex}">
        <div class="cb-question" onclick="toggleBoostAnswer('${_currentBoostLevel}',${qIndex})">
          <div class="cb-qnum">${qIndex+1}</div>
          <div style="flex:1">
            <div class="cb-qtext">${escHtml(q.q)}</div>
            <div class="cb-tap">${revealed ? '✅ Answer देख लिया — tap to collapse' : '👆 Tap करके Answer देखें'}</div>
          </div>
          <div style="font-size:18px;color:var(--muted);padding-left:4px">${revealed?'▲':'▼'}</div>
        </div>
        <div class="cb-answer">
          <div class="cb-answer-text">${q.a}</div>
        </div>
      </div>`;
      qIndex++;
    });
  });
  list.innerHTML = html;
}

function toggleBoostAnswer(level, idx){
  const data = CAREER_BOOST[level];
  if(!data) return;
  const key = 'q' + idx;
  _boostRevealed[key] = !_boostRevealed[key];
  // Save to localStorage
  try{ localStorage.setItem('cb_revealed_' + level, JSON.stringify(_boostRevealed)); }catch(e){}
  // Re-render
  renderCareerBoost(data);
  updateBoostProgress(data);
}

function updateBoostProgress(data){
  let total = 0;
  data.sections.forEach(s => { total += s.questions.length; });
  const done = Object.values(_boostRevealed).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('careerProgressBar').style.width = pct + '%';
  document.getElementById('careerProgressText').textContent = pct + '%';
}

function resetCareerBoost(){
  if(!_currentBoostLevel) return;
  _boostRevealed = {};
  try{ localStorage.removeItem('cb_revealed_' + _currentBoostLevel); }catch(e){}
  const data = CAREER_BOOST[_currentBoostLevel];
  renderCareerBoost(data);
  updateBoostProgress(data);
  toast('🔄 Practice reset — फिर से शुरू करें!');
}

const ABOUT_DEFAULT = {
  intro: `This platform is built from real shop-floor experience — not just theory. Every lesson, every concept here comes from years of working alongside machines, people, and processes in the metalliser industry.\n\nAs one of the youngest experienced managers in this field, I believe that genuine knowledge should be accessible to every operator, technician, and supervisor who wants to grow. This platform is my effort to give back — to share the tools, apps, systems, and practical methods that helped me in my career.\n\nThe people listed below invested their time, guidance, and trust in my journey. This platform is dedicated to each one of them.`,
  seniors:[
    'Mr. Prashant Varshney','Mr. Mahesh Varma','Mr. Amit Khanna','Mr. Raju Kothari',
    'Mr. Deep Chand Pant','Mr. Punit Singh','Mr. Ankit Kulshreshtha','Mr. Vijay Choughuley',
    'Mr. Ahwani D.','Mr. Baldev','Mr. Satinder Attri','Mr. Pradeep Tyle',
    'Mr. Satish Chaubey','Mr. S. S. Akhtar'
  ],
  colleagues:[
    'Mr. Vikas Jain','Mr. Diwakar','Mr. Prasenjeet','Mr. Dinesh','Mr. Pradeep Sharma',
    'Mr. Himanshu Tyagi','Mr. Meer Talim','Mr. N. K. Jena','Mr. Akib','Ms. Praniti',
    'Ms. Amrita','Ms. Anjali','Mr. Manish Patel','Mr. Lalit Sharma','Mr. Balkishan Belwal',
    'Mr. Deepak','Mr. Vijay'
  ],
  family:'My Parents · My Uncles · My Aunts · The Love of My Life · My Brothers and Sisters',
  note:'...and many others whose names may not be listed here but remain preserved in my heart.'
};

let _currentModule = null;
let _currentModuleType = 'audio'; // 'audio' | 'video' | 'live'

function openLearnModule(moduleId){
  _currentModule = moduleId;
  _currentModuleType = 'audio';
  const mod = LEARN_MODULES[moduleId];
  if(!mod){ toast('Module not found'); return; }

  // Check access
  const hasAccess = mod.isFree || isAdmin() || hasAccessTo(mod.plan||moduleId) || hasAccessTo('combo');

  // Switch views
  document.getElementById('learnMainButtons').style.display = 'none';
  document.getElementById('learnModuleView').style.display = 'block';
  document.getElementById('learnAboutView').style.display = 'none';
  document.getElementById('careerBoostView').style.display = 'none';

  document.getElementById('moduleTitle').textContent = mod.icon + ' ' + mod.name;
  document.getElementById('moduleSubtitle').textContent = mod.subtitle;

  // Reset type tabs
  ['audio','video','live'].forEach(t=>{
    const btn = document.getElementById('mtype_'+t);
    if(btn) btn.classList.remove('on');
  });
  const defBtn = document.getElementById('mtype_audio');
  if(defBtn) defBtn.classList.add('on');

  // Admin upload
  const adminUpload = document.getElementById('moduleAdminUpload');
  if(adminUpload) adminUpload.style.display = isAdmin() ? 'block' : 'none';

  renderModuleContent(moduleId, 'audio', hasAccess);
}

function toggleMpLesson(bodyId){
  const body = document.getElementById(bodyId);
  if(!body) return;
  const lessonId = bodyId.replace('mp_body_','');
  const arrow = document.getElementById('mp_arrow_' + lessonId);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if(arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

function closeLearnModule(){
  _currentModule = null;
  // Show main buttons, hide all sub-views
  document.getElementById('learnMainButtons').style.display = 'block';
  document.getElementById('learnModuleView').style.display = 'none';
  document.getElementById('learnAboutView').style.display = 'none';
  document.getElementById('careerBoostView').style.display = 'none';
}

function setModuleType(type, btn){
  _currentModuleType = type;
  document.querySelectorAll('.mtype-btn').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  if(!_currentModule) return;
  const mod = LEARN_MODULES[_currentModule];
  const hasAccess = mod && (mod.isFree || isAdmin() || hasAccessTo(mod.plan||_currentModule) || hasAccessTo('combo'));
  renderModuleContent(_currentModule, type, hasAccess);
}

function renderModuleContent(moduleId, contentType, hasAccess){
  const mod = LEARN_MODULES[moduleId];
  if(!mod) return;

  // Merge with Firebase content
  const fbContent = (_cache.learnContent||[]).filter(c=>c.category===moduleId);

  // Build lessons array (static + firebase)
  const lessons = mod.lessons || [];

  const cl = document.getElementById('moduleContentList');
  if(!cl) return;

  const modColor = mod.color || '#fff';

  let html = '';

  // Locked banner for paid modules
  if(!hasAccess){
    html += `<div style="background:linear-gradient(135deg,rgba(244,63,94,.1),rgba(168,85,247,.08));
      border:1.5px solid rgba(244,63,94,.25);border-radius:14px;padding:14px;margin-bottom:14px;text-align:center">
      <div style="font-size:28px;margin-bottom:6px">🔒</div>
      <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:4px">Premium Content</div>
      <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">इस module को unlock करने के लिए subscribe करें</div>
      <button onclick="showModulePaywall('${moduleId}')" style="background:linear-gradient(135deg,#a855f7,#7c3aed);
        border:none;border-radius:10px;padding:12px 24px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;width:100%">
        💳 Unlock करें — ₹${getPrice(mod.plan||moduleId)}/month
      </button>
      <div style="font-size:11px;color:var(--muted2);margin-top:8px">पहले 2 lessons preview में देखें 👇</div>
    </div>`;
  }

  // Type description bar
  const typeInfo = {
    audio: {icon:'🎵', label:'Audio Lessons', sub:'Listen anytime — on-the-go training', color:'#38bdf8'},
    video: {icon:'🎬', label:'Audio + Video', sub:'Visual + audio — see it to understand', color:'#a855f7'},
    live:  {icon:'🔴', label:'Live / Demo Sessions', sub:'Real-time practical demonstrations', color:'#f97316'},
  };
  const ti = typeInfo[contentType]||typeInfo.audio;
  html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:12px">
    <span style="font-size:20px">${ti.icon}</span>
    <div>
      <div style="font-size:13px;font-weight:800;color:${ti.color}">${ti.label}</div>
      <div style="font-size:10px;color:var(--muted2)">${ti.sub}</div>
    </div>
  </div>`;

  // Static lessons
  lessons.forEach((lesson, idx)=>{
    const isPreview = idx < 2; // first 2 always accessible
    const accessible = hasAccess || isPreview || mod.isFree;
    const available = contentType==='audio'?lesson.audio : contentType==='video'?lesson.video : lesson.live;

    // Man Power modules with real content — show infographic card instead of audio/video buttons
    if(mod.sample && lesson.content && (accessible || isPreview)){
      const c = lesson.content;
      html += `<div class="lesson-card mp-lesson-card" style="border-color:${modColor}44;margin-bottom:14px">
        <div class="lesson-card-head" onclick="toggleMpLesson('mp_body_${lesson.id}')" style="cursor:pointer">
          <div class="lesson-card-num" style="background:${modColor}22;color:${modColor}">${idx+1}</div>
          <div style="flex:1">
            <div class="lesson-card-title">${lesson.title}</div>
            <div class="lesson-card-desc">${lesson.desc}${lesson.date?` · <span style="color:var(--muted2);font-size:10px">${lesson.date}</span>`:''}</div>
          </div>
          <span style="font-size:18px;color:${modColor};flex-shrink:0" id="mp_arrow_${lesson.id}">▼</span>
        </div>
        <div id="mp_body_${lesson.id}" style="display:none;padding:10px 0 4px 0">
          <div style="font-size:11px;font-weight:900;color:${modColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding:6px 10px;background:${modColor}15;border-radius:8px">${c.category||''}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${(c.points||[]).map(p=>`
              <div style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px;border-left:3px solid ${modColor}66">
                <div style="font-size:20px;flex-shrink:0;margin-top:1px">${p.icon}</div>
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:900;color:#fff;margin-bottom:2px">${escHtml(p.label)}</div>
                  <div style="font-size:12px;color:var(--muted2);line-height:1.5;white-space:pre-line">${escHtml(p.text)}</div>
                </div>
              </div>`).join('')}
          </div>
          ${c.rule?`<div style="margin-top:10px;padding:10px 12px;background:rgba(244,163,0,.1);border:1.5px solid rgba(244,163,0,.3);border-radius:10px;font-size:12px;font-weight:800;color:#fbbf24;line-height:1.5">${escHtml(c.rule)}</div>`:''}
          ${lesson.sop?`<div style="margin-top:8px;font-size:10px;color:var(--muted2);text-align:right">📄 SOP: ${escHtml(lesson.sop)}</div>`:''}
        </div>
      </div>`;
      return;
    }

    html += `<div class="lesson-card">
      <div class="lesson-card-head">
        <div class="lesson-card-num" style="background:${modColor}22;color:${modColor}">${idx+1}</div>
        <div style="flex:1">
          <div class="lesson-card-title">${lesson.title}</div>
          <div class="lesson-card-desc">${lesson.desc}</div>
        </div>
        ${isPreview&&!mod.isFree?`<span style="font-size:9px;background:rgba(34,197,94,.15);color:var(--green);border-radius:4px;padding:2px 6px;font-weight:800;font-family:'Barlow Condensed',sans-serif;flex-shrink:0">FREE</span>`:''}
      </div>
      <div class="ctype-row">
        <button class="ctype-pill ${contentType==='audio'?(lesson.audio?(accessible?'avail':'locked'):'soon'):(contentType==='video'?(lesson.video?(accessible?'avail-v':'locked'):'soon'):(lesson.live?(accessible?'avail-l':'locked'):'soon'))}"
          onclick="${accessible&&available?`playLearnContent('${lesson.id}','${contentType}','${moduleId}','${lesson.title}')`:(accessible&&!available?'toast("जल्द आ रहा है! ⏳")':`showModulePaywall('${moduleId}')`)}">
          ${contentType==='audio'?'🎵 Audio':contentType==='video'?'🎬 Video':'🔴 Live'}
          ${available?(accessible?'':'🔒'):'⏳'}
        </button>
      </div>
    </div>`;
  });

  // Firebase-added content for this module
  const fbFiltered = fbContent.filter(c=>{
    if(contentType==='audio') return c.type==='audio';
    if(contentType==='video') return c.type==='video';
    return c.type==='live';
  });
  fbFiltered.forEach(c=>{
    html += `<div class="lesson-card" style="border-color:rgba(${mod.color==='#f97316'?'249,115,22':'168,85,247'},.2)">
      <div class="lesson-card-head">
        <div class="lesson-card-num" style="background:rgba(168,85,247,.12);color:#a855f7">+</div>
        <div style="flex:1">
          <div class="lesson-card-title">${c.title}</div>
          <div class="lesson-card-desc">${c.description||''} ${c.duration?'· '+c.duration:''}</div>
        </div>
        ${isAdmin()?`<button onclick="deleteLearnContent('${c.id}')" style="background:rgba(244,63,94,.1);border:none;color:#f43f5e;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;flex-shrink:0">🗑️</button>`:''}
      </div>
      <div class="ctype-row">
        <button class="ctype-pill ${hasAccess||mod.isFree?'avail':'locked'}"
          onclick="${hasAccess||mod.isFree?`playLearnContent('${c.id}','${contentType}','${moduleId}','${c.title}')`:`showModulePaywall('${moduleId}')`}">
          ${contentType==='audio'?'🎵 Audio':contentType==='video'?'🎬 Video':'🔴 Live'} Play ${hasAccess||mod.isFree?'':'🔒'}
        </button>
      </div>
    </div>`;
  });

  if(!lessons.length && !fbFiltered.length){
    html += `<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">इस type का content जल्द आ रहा है</div></div>`;
  }

  cl.innerHTML = html;
}

function playLearnContent(id, type, moduleId, title){
  const mod = LEARN_MODULES[moduleId]||{};
  // Check firebase for url
  const fbItem = (_cache.learnContent||[]).find(c=>c.id===id);
  const url = fbItem ? fbItem.url : '';

  let body = `<div class="modal-handle"></div>
    <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:4px">${title}</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:14px">${mod.name||''} · ${type==='audio'?'🎵 Audio':type==='video'?'🎬 Video':'🔴 Live Demo'}</div>`;

  if(type==='live'){
    body += `<div style="background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.25);border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">🔴</div>
      <div style="font-size:15px;font-weight:900;color:var(--m1);margin-bottom:4px">Live Demo Session</div>
      <div style="font-size:12px;color:var(--muted2);line-height:1.6;margin-bottom:14px">
        यह session एक real-time practical demonstration है।<br>Admin द्वारा schedule होने पर notify किया जाएगा।
      </div>
      ${url?`<a href="${url}" target="_blank" style="display:block;background:rgba(249,115,22,.15);border:1px solid rgba(249,115,22,.3);border-radius:10px;padding:12px;color:var(--m1);text-decoration:none;font-weight:700;font-size:13px">🔗 Session Join करें</a>`:'<div style="font-size:12px;color:var(--muted2)">📅 Session date/time admin announce करेंगे</div>'}
    </div>`;
  } else if(type==='audio'){
    if(url){
      body += `<div class="audio-player">
        <div style="font-size:44px;margin-bottom:8px">🎵</div>
        <audio controls style="width:100%;border-radius:8px"><source src="${url}" type="audio/mpeg">Audio support नहीं</audio>
      </div>`;
    } else {
      body += `<div class="audio-player"><div style="font-size:44px;margin-bottom:8px">🎵</div>
        <div style="font-size:13px;color:var(--muted2)">🎙️ Audio content जल्द upload होगा<br><span style="font-size:11px;opacity:.7">Admin contact करें</span></div>
      </div>`;
    }
  } else {
    if(url){
      body += `<div class="video-player"><video controls style="width:100%"><source src="${url}" type="video/mp4">Video support नहीं</video></div>`;
    } else {
      body += `<div style="background:#000;border-radius:14px;padding:40px;text-align:center">
        <div style="font-size:44px;margin-bottom:8px">🎬</div>
        <div style="font-size:13px;color:var(--muted2)">Video जल्द upload होगा</div>
      </div>`;
    }
  }
  body += `<button class="cancel-btn" onclick="closePlayer()" style="margin-top:14px">बंद करें</button>`;
  document.getElementById('playerBody').innerHTML = body;
  document.getElementById('playerOverlay').classList.add('open');
}

function showModulePaywall(moduleId){
  const mod = LEARN_MODULES[moduleId]||{};
  const price = getPrice(mod.plan||moduleId);
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;padding:10px 0 4px">
    <div style="font-size:44px;margin-bottom:8px">${mod.icon||'🔒'}</div>
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:4px">${mod.name}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:16px;line-height:1.6">${mod.subtitle||''}</div>
    <div style="background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:900;color:#a855f7">₹${price}<span style="font-size:14px">/month</span></div>
      <div style="font-size:11px;color:var(--muted2)">Audio + Video + Live Demo · Unlimited Access</div>
    </div>
    <button onclick="closeModal();_selectedPlan='${mod.plan||moduleId}';proceedToPayment2()" style="width:100%;padding:14px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:8px">
      💳 Subscribe करें — ₹${price}/month
    </button>
    <button onclick="closeModal();_selectedPlan='combo';proceedToPayment2()" style="width:100%;padding:12px;background:linear-gradient(135deg,rgba(249,115,22,.15),rgba(168,85,247,.15));border:1px solid rgba(249,115,22,.3);border-radius:12px;color:var(--m1);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">
      🎯 All Access Combo — ₹${getPrice('combo')}/month
    </button>
    <button class="cancel-btn" onclick="closeModal()">बाद में</button>
  </div>`);
}

function proceedToPayment2(){
  if(!_selectedPlan) return;
  // Show payment form
  const ps = document.getElementById('learnPlansSection');
  if(ps){
    ps.style.display = 'block';
    proceedToPayment();
  }
}

function openContentUploadForModule(){
  // Pre-select current module in the upload modal
  openContentUpload();
  setTimeout(()=>{
    const catEl = document.getElementById('ct_cat');
    if(catEl && _currentModule) catEl.value = _currentModule;
  }, 100);
}

// ── DELETE CONTENT (Admin) ──
async function deleteLearnContent(id){
  if(!isAdmin()){ toast('Only admin'); return; }
  // Find firebase key by id field
  const allContent = _cache.learnContent || [];
  const item = allContent.find(c=>c.id===id);
  if(!item){ toast('Content not found'); return; }
  await fbSet('learnContent/'+id, null);
  toast('🗑️ Content हटा दिया');
  renderModuleContent(_currentModule, _currentModuleType, true);
}

// ── ABOUT / DEDICATION ──
function openLearnAbout(){
  document.getElementById('learnMainButtons').style.display = 'none';
  document.getElementById('learnModuleView').style.display = 'none';
  document.getElementById('learnAboutView').style.display = 'block';
  renderAboutContent();
}

function renderAboutContent(){
  const el = document.getElementById('aboutContent');
  if(!el) return;
  // Load from Firebase or use default
  const data = (_cache.aboutContent) || ABOUT_DEFAULT;

  el.innerHTML = `
    <!-- Intro Para -->
    <div class="about-section" style="border-color:rgba(251,191,36,.25)">
      <div class="about-section-title" style="color:#fbbf24">🌟 The Vision</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7;white-space:pre-line">${data.intro||ABOUT_DEFAULT.intro}</div>
    </div>

    <!-- Seniors -->
    <div class="about-section" style="border-color:rgba(249,115,22,.25)">
      <div class="about-section-title" style="color:var(--m1)">🙏 Seniors — जिनसे सीखा</div>
      ${(data.seniors||ABOUT_DEFAULT.seniors).map(n=>`<div class="about-person">👴 ${n}</div>`).join('')}
    </div>

    <!-- Colleagues -->
    <div class="about-section" style="border-color:rgba(56,189,248,.2)">
      <div class="about-section-title" style="color:var(--s1)">🤝 Colleagues — साथ काम किया</div>
      ${(data.colleagues||ABOUT_DEFAULT.colleagues).map(n=>`<div class="about-person">🧑‍💼 ${n}</div>`).join('')}
      <div style="font-size:12px;color:var(--muted2);margin-top:8px;font-style:italic">${data.note||ABOUT_DEFAULT.note}</div>
    </div>

    <!-- Family -->
    <div class="about-section" style="border-color:rgba(244,63,94,.2)">
      <div class="about-section-title" style="color:#f43f5e">❤️ Family — सबसे बड़ा Support</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7">${data.family||ABOUT_DEFAULT.family}</div>
    </div>

    <!-- Professional note -->
    <div style="text-align:center;padding:12px 0 4px">
      <div style="font-size:11px;color:var(--muted2);line-height:1.7">
        Their belief, support, and contribution helped shape<br>my learning, my growth, and my perspective.<br>
        <span style="color:#fbbf24;font-weight:700">Thank you. 🙏</span>
      </div>
    </div>

    ${isAdmin()?`<button onclick="openEditAbout()" style="width:100%;margin-top:14px;padding:12px;background:rgba(251,191,36,.1);border:1.5px solid rgba(251,191,36,.25);border-radius:12px;color:#fbbf24;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit">✏️ Admin: Edit Dedication</button>`:''}
  `;
}

// ── ADMIN: Edit About / Dedication ──
function openEditAbout(){
  if(!isAdmin()){ toast('Only admin'); return; }
  const data = (_cache.aboutContent) || ABOUT_DEFAULT;
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">✏️ Edit Dedication Section</div>
  <div class="field"><label>Intro Paragraph</label>
    <textarea class="inp-field" id="ea_intro" style="height:100px;font-size:12px">${(data.intro||ABOUT_DEFAULT.intro).replace(/</g,'&lt;')}</textarea></div>
  <div class="field"><label>Seniors (एक लाइन में एक नाम)</label>
    <textarea class="inp-field" id="ea_seniors" style="height:80px;font-size:12px">${(data.seniors||ABOUT_DEFAULT.seniors).join('\n')}</textarea></div>
  <div class="field"><label>Colleagues</label>
    <textarea class="inp-field" id="ea_colleagues" style="height:80px;font-size:12px">${(data.colleagues||ABOUT_DEFAULT.colleagues).join('\n')}</textarea></div>
  <div class="field"><label>Family Line</label>
    <input class="inp-field" id="ea_family" value="${data.family||ABOUT_DEFAULT.family}"></div>
  <div class="field"><label>Closing Note</label>
    <input class="inp-field" id="ea_note" value="${data.note||ABOUT_DEFAULT.note}"></div>
  <button class="submit-btn" onclick="saveAboutContent()">💾 Save करें</button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

async function saveAboutContent(){
  const intro = document.getElementById('ea_intro').value.trim();
  const seniors = document.getElementById('ea_seniors').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const colleagues = document.getElementById('ea_colleagues').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const family = document.getElementById('ea_family').value.trim();
  const note = document.getElementById('ea_note').value.trim();
  await fbSet('aboutContent', {intro, seniors, colleagues, family, note, updatedAt:new Date().toISOString(), updatedBy:SESSION.name});
  toast('✅ Dedication save हो गई!');
  closeModal();
  renderAboutContent();
}

// ── ADMIN: Price Manager ──
function openLearnPriceManager(){
  if(!isAdmin()){ toast('Only admin'); return; }
  const plans = [
    {key:'met_operation', label:'🏭 Advanced Met Opr.'},
    {key:'met_maintenance', label:'🔧 Advanced Met Maint.'},
    {key:'supervisor', label:'👔 Advanced Supervisor'},
    {key:'managerial', label:'📊 Managerial Skill'},
    {key:'combo', label:'🎯 All Access Combo'},
  ];
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">💰 Module Prices</div>
  ${plans.map(p=>`<div class="field"><label>${p.label}</label>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="inp-field" id="pm_${p.key}" type="number" value="${getPrice(p.key)}" style="flex:1;margin-bottom:0">
      <button onclick="saveSinglePrice('${p.key}')" style="background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:8px 12px;color:var(--green);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Save</button>
    </div></div>`).join('')}
  <button class="cancel-btn" onclick="closeModal()">बंद करें</button>`);
}

async function saveSinglePrice(plan){
  const val = parseInt(document.getElementById('pm_'+plan)?.value);
  if(isNaN(val)||val<0){ toast('सही price डालें'); return; }
  await fbSet('learnPrices/'+plan, {price:val, updatedAt:new Date().toISOString(), updatedBy:SESSION.name});
  toast('✅ '+plan+' price saved!');
  renderLearnScreen();
}

// Update initLearnListeners to also load aboutContent

// Listen to learnContent in Firebase
function initLearnListeners(){
  fbListen('learnButtons', v=>{
    _cache.learnButtons = v ? Object.values(v).filter(b=>b&&b.label) : [];
    renderLearnButtons();
  });
  fbListen('learnContent', v=>{
    _cache.learnContent = v ? Object.values(v) : [];
    if(document.getElementById('learnScreen').classList.contains('show')){
      if(_currentModule) renderModuleContent(_currentModule, _currentModuleType,
        (LEARN_MODULES[_currentModule]||{}).isFree || isAdmin() || hasAccessTo(LEARN_MODULES[_currentModule]?.plan||_currentModule));
      else renderLearnScreen();
    }
  });
  fbListen('learnPrices', v=>{
    _cache.learnPrices = v || {};
    if(document.getElementById('learnScreen').classList.contains('show')) renderLearnScreen();
  });
  fbListen('aboutContent', v=>{
    _cache.aboutContent = v || null;
    // Re-render about if visible
    if(document.getElementById('learnAboutView')?.style.display==='block') renderAboutContent();
  });
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
// ══════════════════════════════════════════════
// FINGERPRINT / BIOMETRIC LOGIN
// Uses WebAuthn — works on Android/iPhone/Windows
// ══════════════════════════════════════════════

const FP_KEY = 'mp_fp_enabled';
const FP_CRED_KEY = 'mp_fp_credId';

// Check if biometric is available on this device
async function isBiometricAvailable(){
  try{
    if(!window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  }catch(e){ return false; }
}

// Register fingerprint after successful login
async function registerFingerprint(userName, userId){
  try{
    const available = await isBiometricAvailable();
    if(!available){ 
      console.log('Biometric not available on this device');
      return; 
    }
    
    // Already registered for this user
    const fpUserKey = FP_KEY + '_' + userId;
    if(localStorage.getItem(fpUserKey)==='1') return;
    
    // Ask user if they want to enable fingerprint
    const want = await showFpSetupPrompt(userName);
    if(!want) return;
    
    // Create credential
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    const cred = await navigator.credentials.create({
      publicKey:{
        challenge,
        rp:{ name:'Man Power System', id: location.hostname },
        user:{
          id: new TextEncoder().encode(userId||'mp_user'),
          name: userName,
          displayName: userName
        },
        pubKeyCredParams:[{alg:-7,type:'public-key'},{alg:-257,type:'public-key'}],
        authenticatorSelection:{
          authenticatorAttachment:'platform',
          userVerification:'required'
        },
        timeout:60000,
        attestation:'none'
      }
    });
    
    if(cred){
      // Save credential ID
      const credId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
      localStorage.setItem(FP_KEY, '1'); // global flag
      localStorage.setItem(FP_KEY+'_'+userId, '1'); // per-user flag
      localStorage.setItem(FP_CRED_KEY, credId);
      toast('✅ Fingerprint login set up हो गया!');
    }
  }catch(e){ 
    if(e.name!=='NotAllowedError') console.log('FP register error:',e.name);
  }
}

// Show fingerprint setup prompt
function showFpSetupPrompt(userName){
  return new Promise(resolve=>{
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px';
    modal.innerHTML = `
      <div style="background:var(--panel);border-radius:20px;padding:24px;max-width:320px;width:100%;text-align:center;border:1px solid var(--border2)">
        <div style="font-size:48px;margin-bottom:12px">👆</div>
        <div style="font-size:17px;font-weight:900;color:#fff;margin-bottom:8px">Fingerprint Login Setup करें?</div>
        <div style="font-size:13px;color:var(--muted2);margin-bottom:20px;line-height:1.6">
          ${userName}, अगली बार सिर्फ fingerprint से login करें<br>
          <span style="color:var(--muted);font-size:11px">Password हर बार नहीं डालना पड़ेगा</span>
        </div>
        <button onclick="this.closest('.fp-modal').dataset.res='yes'" 
          style="width:100%;padding:14px;background:linear-gradient(135deg,#f97316,#a855f7);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:8px">
          👆 हाँ, Setup करें
        </button>
        <button onclick="this.closest('.fp-modal').dataset.res='no'"
          style="width:100%;padding:12px;background:none;border:1px solid var(--border2);border-radius:12px;color:var(--muted);font-size:13px;cursor:pointer">
          बाद में
        </button>
      </div>`;
    modal.querySelector('div').classList.add('fp-modal');
    document.body.appendChild(modal);
    
    modal.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const res = modal.querySelector('.fp-modal').dataset.res;
        document.body.removeChild(modal);
        resolve(res==='yes');
      });
    });
  });
}

// Try fingerprint login on app open
async function tryFingerprintLogin(){
  const fpEl = document.getElementById('fpRing');
  const titleEl = document.getElementById('fpTitle');
  const subEl = document.getElementById('fpSub');
  
  try{
    if(fpEl) fpEl.style.borderColor = '#f97316';
    if(titleEl) titleEl.textContent = 'Verifying...';
    
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    // Build allowCredentials if we have a saved credId
    const savedCredId = localStorage.getItem(FP_CRED_KEY);
    const allowCreds = savedCredId ? [{
      id: Uint8Array.from(atob(savedCredId), c=>c.charCodeAt(0)),
      type: 'public-key',
      transports: ['internal','hybrid']
    }] : [];
    
    const getOptions = {
      publicKey:{
        challenge,
        timeout: 60000,
        userVerification: 'preferred',  // 'required' causes failure on some Android
      }
    };
    if(allowCreds.length) getOptions.publicKey.allowCredentials = allowCreds;
    
    const assertion = await navigator.credentials.get(getOptions);
    
    if(assertion){
      if(fpEl) fpEl.style.borderColor = '#22c55e';
      if(titleEl) titleEl.textContent = '✅ Verified!';
      setTimeout(async ()=>{
        hideFpScreen();
        // Re-fetch fresh session from Firebase to get correct role & approval status
        try{
          const s = localStorage.getItem('mp_session');
          if(s){
            const sess = decodeSession(s);
            if(sess && sess.empObjId){
              const freshEmp = await fbGet('employees/'+sess.empObjId);
              if(freshEmp){
                // Update session with fresh role/accessLevel from Firebase
                const accessLevel = freshEmp.accessLevel||'worker';
                const isMgrRole = accessLevel==='manager' || freshEmp.sec==='MGR' || freshEmp.designation==='Manager';
                sess.role = sess.role==='admin' ? 'admin' : (isMgrRole ? 'manager' : (sess.role||'user'));
                sess.accessLevel = accessLevel;
                // Re-encode and save updated session
                try{ localStorage.setItem('mp_session', btoa(unescape(encodeURIComponent(JSON.stringify(sess))))); }catch(e){}
              }
            }
          }
        }catch(fetchErr){ console.warn('[FP role refresh]', fetchErr); }
        writeIntegrityToken();
        launchApp();
        toast('👆 Fingerprint से login हो गया!');
      }, 500);
    }
  }catch(e){
    console.log('FP login error:', e.name, e.message);
    if(e.name==='NotAllowedError'){
      if(titleEl) titleEl.textContent = 'Cancelled / Timeout';
      if(subEl) subEl.innerHTML = 'दोबारा try करें या<br>Password से login करें';
    } else if(e.name==='InvalidStateError'||e.name==='NotSupportedError'){
      // Credential not found — clear and ask to re-register
      localStorage.removeItem(FP_KEY);
      localStorage.removeItem(FP_CRED_KEY);
      if(titleEl) titleEl.textContent = 'Fingerprint reset हो गई';
      if(subEl) subEl.innerHTML = 'Password से login करें — दोबारा setup होगा';
    } else {
      if(titleEl) titleEl.textContent = 'Error — Password try karein';
    }
    if(fpEl) fpEl.style.borderColor = '#ef4444';
    setTimeout(()=>{ if(fpEl) fpEl.style.borderColor = 'rgba(249,115,22,.3)'; }, 2000);
  }
}

function showFpScreen(){
  const fp = document.getElementById('fingerprintScreen');
  const login = document.getElementById('loginScreen');
  // fp is now a sibling of loginScreen (not a child) — hide login, show fp independently
  if(login){ login.classList.remove('show'); login.style.display='none'; }
  if(fp){ fp.style.display='flex'; fp.classList.add('show'); }

  // Show saved user name in chip
  try{
    const s = localStorage.getItem('mp_session');
    if(s){
      const sess = decodeSession(s);
      if(sess && sess.name){
        const nameEl = document.getElementById('fpUserName');
        const avEl   = document.getElementById('fpUserAv');
        const chip   = document.getElementById('fpUserChip');
        const ini    = sess.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
        if(nameEl) nameEl.textContent = sess.name.split(' ')[0];
        if(avEl)   avEl.textContent   = ini;
        if(chip)   chip.style.display = 'inline-flex';
      }
    }
  }catch(e){}
}

function hideFpScreen(){
  const fp = document.getElementById('fingerprintScreen');
  if(fp){ fp.classList.remove('show'); fp.style.display='none'; }
}

function skipFingerprint(){
  hideFpScreen();
  // If session still valid, try device password instead of full mobile OTP
  try{
    if(SESSION && SESSION.role){
      const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
      const empObjId = SESSION.empObjId || '';
      const hasPw = typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, mob);
      if(hasPw){
        // Re-load userData path via mobile password screen
        (async()=>{
          try{
            const userData = mob ? await fbGet('mobileUsers/'+mob) : null;
            if(userData && userData.status==='approved'){
              showPasswordLoginForMobile(userData, mob, typeof getDeviceId==='function'?getDeviceId():'');
              return;
            }
          }catch(e){}
          // Fallback: password screen from SESSION
          const emp = { id: empObjId||('m_'+mob), name: SESSION.name||'', empId: SESSION.empId||'', phone:mob, mobile:mob };
          showPasswordLoginScreen(emp, typeof getDeviceId==='function'?getDeviceId():'');
        })();
        return;
      }
    }
  }catch(e){}
  const login = document.getElementById('loginScreen');
  if(login){ login.classList.add('show'); login.style.display='flex'; }
  showStep(1);
}

// Check if fingerprint is set up and session exists — show fp screen (v2.4.3)
async function checkFingerprintOnStart(){
  try{
    const fpEnabled = localStorage.getItem(FP_KEY) === '1';
    const hasCred = !!localStorage.getItem(FP_CRED_KEY);
    const hasSession = !!(SESSION && SESSION.role);
    if(!fpEnabled || !hasCred || !hasSession) return false;
    const available = await isBiometricAvailable();
    if(!available) return false;
    // Safety: if FP screen missing in DOM, skip
    if(!document.getElementById('fingerprintScreen')) return false;
    showFpScreen();
    // Auto-trigger biometric after short delay (no OTP each time feel)
    setTimeout(()=>{ try{ tryFingerprintLogin(); }catch(e){} }, 400);
    return true;
  }catch(e){
    console.warn('[FP gate]', e);
    return false;
  }
}

function startApp(){
  try{
    try{ _loadWaAppLinkSettings(); }catch(e){}
    initAdminAuth();
    check45DayLogout();
    try{ recoverStuckPendingStates(); }catch(e){}
    // ── Always kill loading screen ──
    var ls=document.getElementById('loadingScreen');
    if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
    if(!checkLicense()){
      // Still re-validate against Firebase when online
      refreshLicenseFromServer().then(ok=>{
        if(ok){ try{ startApp(); }catch(e){} }
      }).catch(()=>{});
      return;
    }
    // Background refresh — may lock if server expiry moved
    refreshLicenseFromServer().catch(()=>{});

    // ── If session exists, check fingerprint first ──
    if(loadSession() && SESSION.role){
      checkFingerprintOnStart().then(fpShown=>{
        if(!fpShown){ launchApp(); }
      }).catch(()=>{ launchApp(); });
      return;
    }

    // iPhone ITP fallback — try IndexedDB
    loadSessionFromIDB().then(found=>{
      if(found && SESSION.role){
        checkFingerprintOnStart().then(fpShown=>{
          if(!fpShown){ launchApp(); }
        }).catch(()=>{ launchApp(); });
        return;
      }
      // No session anywhere — show login screen
      _showLoginScreenSafely();
    }).catch(()=>{
      _showLoginScreenSafely();
    });

  }catch(e){
    console.error('startApp error:',e);
    _showLoginScreenSafely();
  }
}


// ══════════════════════════════════════════════════════════════
// BLACK SCREEN WATCHDOG — ultimate safety net
// If mainContent is still hidden 5s after load AND Firebase fired,
// something went wrong — force recover to login or app.
// ══════════════════════════════════════════════════════════════
// Early watchdog at 2s — catches fast failures
function _isVisiblyBlank(){
  try{
    var login = document.getElementById('loginScreen');
    var mc = document.getElementById('mainContent');
    var mh = document.getElementById('mainHdr');
    var ls = document.getElementById('loadingScreen');
    var fp = document.getElementById('fingerprintScreen');
    var loginOn = login && (login.classList.contains('show') || (login.style.display && login.style.display !== 'none'));
    var appOn = (mc && mc.style.display && mc.style.display !== 'none') || (mh && mh.style.display && mh.style.display !== 'none');
    var loadOn = ls && ls.style.display !== 'none' && ls.style.visibility !== 'hidden' && parseFloat(ls.style.opacity||'1')>0.1;
    var fpOn = fp && (fp.classList.contains('show') || fp.style.display === 'flex');
    if(loginOn || appOn || loadOn || fpOn) return false;
    return true;
  }catch(e){ return false; }
}
function _forceRecoverFromBlack(){
  try{
    console.warn('[RECOVER] forcing login UI');
    if(typeof _showLoginScreenSafely==='function') _showLoginScreenSafely();
    else {
      var login=document.getElementById('loginScreen');
      if(login){ login.style.display='flex'; login.classList.add('show'); }
    }
  }catch(e){}
}
setTimeout(function _earlyWatchdog(){
  try{
    var ls = document.getElementById('loadingScreen');
    if(ls){ ls.style.cssText = 'display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
    if(!_isVisiblyBlank()) return;
    if(typeof loadSession==='function' && loadSession() && SESSION.role){
      if(typeof launchApp==='function'){
        Promise.resolve(launchApp()).catch(function(){ _forceRecoverFromBlack(); });
        setTimeout(function(){ if(_isVisiblyBlank()) _forceRecoverFromBlack(); }, 1500);
        return;
      }
    }
    _forceRecoverFromBlack();
  }catch(ex){ try{ _forceRecoverFromBlack(); }catch(e){} }
}, 1500);

setTimeout(function _blackScreenWatchdog(){
  try{
    var mc = document.getElementById('mainContent');
    var login = document.getElementById('loginScreen');
    var ls = document.getElementById('loadingScreen');
    var fp = document.getElementById('fingerprintScreen');

    // Loading screen still blocking? Kill it
    if(ls && ls.style.display !== 'none'){
      ls.style.cssText = 'display:none!important;opacity:0;pointer-events:none;visibility:hidden';
    }

    // Already visible — all good
    if(mc && mc.style.display !== 'none') return;
    // Login screen showing (any display value that isn't none)
    if(login && login.style.display && login.style.display !== 'none') return;
    if(login && login.classList.contains('show')) return;
    // Fingerprint screen showing — check both class AND direct display style
    if(fp && (fp.classList.contains('show') || fp.style.display === 'flex')) return;
    // Any fullscreen overlay covering the app — not a black screen
    if(document.getElementById('hardExpiryWall')) return;
    if(document.getElementById('loginApprovalOverlay')?.style.display !== 'none') return;
    if(document.getElementById('pwLoginOverlay')?.style.display !== 'none') return;
    if(document.getElementById('otpLoginOverlay')?.style.display !== 'none') return;
    if(document.getElementById('newRegOverlay')?.style.display !== 'none') return;

    console.warn('[WATCHDOG] Black screen detected at 5s — recovering');

    // Session exists? Try to re-launch
    if(typeof loadSession === 'function' && loadSession() && SESSION.role){
      if(typeof launchApp === 'function') launchApp();
      return;
    }
    // No session — show login
    if(login){ login.style.display='flex'; login.classList.add('show'); }
    if(typeof showStep === 'function') showStep(1);
  }catch(ex){ console.error('[WATCHDOG] error:', ex); }
}, 5000);

document.addEventListener('firebase-ready', async ()=>{
  // Wait for section HTML partials (schedule, leave, etc.) to be injected
  try{ if(window.__sectionsReady) await window.__sectionsReady; }catch(e){ console.warn('[sections]', e); }

  _fbStarted = true; // Mark Firebase handled startup — disable fallback timers
  _fbReady=true;
  // Immediately kill loading screen — don't rely on animation timing
  (function(){ var ls=document.getElementById('loadingScreen'); if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; } })();

  // ── CACHE INTEGRITY CHECK — must run before startApp ──
  // If app cache was cleared (files deleted), session is invalidated here.
  // enforceIntegrityOnBoot() throws 'INTEGRITY_FAIL' if it shows login screen itself.
  try{ await enforceIntegrityOnBoot(); }catch(e){
    if(e && e.message === 'INTEGRITY_FAIL'){
      // Login screen already shown by enforceIntegrityOnBoot — stop here
      initSecurityProtection(); initPWA(); loadSmsSettings().catch(()=>{});
      return;
    }
  }

  initSecurityProtection();
  initPWA();
  // Load SMS settings in background
  loadSmsSettings().catch(e=>{});
  // ── Sign in anonymously early so Firebase rules work for initData ──
  try{ await window._fbSignInAnon(); }catch(e){ console.warn('[boot] Anon auth:', e.message); }
  // ── Run initData first so employees are in cache before login screen ──
  try{ await initData(); }catch(e){ console.warn('initData err:',e); }
  startApp();
});

// ── bfcache / iOS back-forward restore fix ──
// When iOS Safari restores from bfcache, Firebase listeners are dead.
// Detect this via pageshow(persisted=true) and restart the app.
window.addEventListener('pageshow', function(e){
  if(e.persisted){
    // Page was restored from bfcache — session may still be valid
    // but Firebase listeners are gone. Re-run startApp() safely.
    console.log('[PTR-FIX] bfcache restore detected — restarting app');
    // Kill loading screen in case it reappeared
    var ls = document.getElementById('loadingScreen');
    if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
    // If app was already showing, just re-wire Firebase listeners
    var hdr = document.getElementById('mainHdr');
    if(hdr && hdr.style.display !== 'none'){
      // App was visible — just re-init data listeners silently
      try{ initData(); }catch(ex){}
    } else {
      // App wasn't showing — run full start
      try{ startApp(); }catch(ex){}
    }
  }
});


// ════════════════════════════════════════
// SECURITY PROTECTION
// ════════════════════════════════════════
function initSecurityProtection(){
  // 1. Disable right click (minor deterrent)
  document.addEventListener('contextmenu', e=>{ e.preventDefault(); return false; });

  // 2. Disable common keyboard shortcuts (save, print, view-source)
  document.addEventListener('keydown', e=>{
    if(e.key==='F12'){ e.preventDefault(); return false; }
    if(e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c','K','k'].includes(e.key)){ e.preventDefault(); return false; }
    if(e.ctrlKey && ['U','u','S','s'].includes(e.key)){ e.preventDefault(); return false; }
  });

  // 3. Disable drag
  document.addEventListener('dragstart', e=> e.preventDefault());

  // 4. Long press on mobile — disable callout
  document.body.style.webkitTouchCallout = 'none';

  // NOTE: DevTools size detection and auto-logout REMOVED
  // It caused false positives on split-screen, tablets, and keyboard popup
  // and provided zero real security (anyone can bypass client-side JS)
}

// ════════════════════════════════════════
// TO-DO SYSTEM
// ════════════════════════════════════════
let _todoFilter = 'all';
let _todoFormImages = []; // base64 images for current form

// ── Firebase helpers for todos ──
async function fbGetTodos(){
  try{ const d=await fbGet('todos'); return d||{}; }catch(e){ return {}; }
}
async function fbSetTodo(id,data){ await fbSet('todos/'+id,data); }
async function fbRemoveTodo(id){ await fbRemove('todos/'+id); }

function setTodoFilter(f,el){
  _todoFilter=f;
  document.querySelectorAll('#todoFilter .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  renderTodo();
}

function updateTodoBadge(){
  const badge=document.getElementById('todoBadge');
  if(!badge) return;
  try{
    let todos=Object.values(window._cachedTodos||{});
    if(!isAdminOrMgr()){
      const myEmpObjId=SESSION.empObjId||''; const myEmpId=SESSION.empId||''; const myName=(SESSION.name||'').toLowerCase();
      todos=todos.filter(t=>t.assignedToEmpId===myEmpObjId||(t.assignedToEmpId===''&&t.assignedTo&&t.assignedTo.toLowerCase()===myName)||t.createdBy===myEmpId||t.createdBy===myEmpObjId);
    }
    const pending=todos.filter(t=>!t.done).length;
    if(pending>0){ badge.textContent=pending>9?'9+':pending; badge.style.display='flex'; }
    else { badge.style.display='none'; }
    // PC sidebar badge
    const pcBadge=document.getElementById('pcTodoBadge');
    if(pcBadge){ if(pending>0){pcBadge.textContent=pending>9?'9+':pending;pcBadge.style.display='flex';}else{pcBadge.style.display='none';} }
  }catch(e){}
}

async function renderTodo(){
  const listEl=document.getElementById('todoList');
  if(!listEl) return;
  // Show add button only for admin or MGR
  const addBtn = document.getElementById('todoAddBtn');
  if(addBtn) addBtn.style.display = isAdminOrMgr() ? 'flex' : 'none';
  listEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">⏳ लोड हो रहा है...</div>';

  try{
    const raw = await fbGetTodos();
    window._cachedTodos = raw;
    let todos = Object.entries(raw).map(([id,v])=>({...v,id}));
    // Sort: pending first, then by createdAt desc
    todos.sort((a,b)=>{
      if(a.done!==b.done) return a.done?1:-1;
      return (b.createdAt||0)-(a.createdAt||0);
    });

    // ── Per-user visibility filter ──
    // Workers only see todos assigned to them OR created by them
    if(!isAdminOrMgr()){
      const myEmpObjId = SESSION.empObjId || '';
      const myEmpId    = SESSION.empId    || '';
      const myName     = (SESSION.name    || '').toLowerCase();
      todos = todos.filter(t =>
        // assigned to this worker (by empObjId or by name fallback)
        t.assignedToEmpId === myEmpObjId ||
        (t.assignedToEmpId === '' && t.assignedTo && t.assignedTo.toLowerCase() === myName) ||
        // or created by this worker
        t.createdBy === myEmpId || t.createdBy === myEmpObjId
      );
    }

    // Priority/status filter (applied after visibility filter)
    if(_todoFilter==='pending') todos=todos.filter(t=>!t.done);
    else if(_todoFilter==='done') todos=todos.filter(t=>t.done);
    else if(_todoFilter==='high') todos=todos.filter(t=>t.priority==='high'&&!t.done);
    else if(_todoFilter==='medium') todos=todos.filter(t=>t.priority==='medium'&&!t.done);
    else if(_todoFilter==='low') todos=todos.filter(t=>t.priority==='low'&&!t.done);

    // Stats — workers see their own stats, admin/mgr see all
    const statScope = isAdminOrMgr() ? Object.values(raw) : todos;
    const allForStats = isAdminOrMgr() ? Object.values(raw) : (() => {
      const myEmpObjId = SESSION.empObjId||''; const myEmpId=SESSION.empId||''; const myName=(SESSION.name||'').toLowerCase();
      return Object.values(raw).filter(t=> t.assignedToEmpId===myEmpObjId||(t.assignedToEmpId===''&&t.assignedTo&&t.assignedTo.toLowerCase()===myName)||t.createdBy===myEmpId||t.createdBy===myEmpObjId);
    })();
    const totalCount=allForStats.length;
    const doneCount=allForStats.filter(t=>t.done).length;
    const pendingCount=totalCount-doneCount;
    const statsTotal=document.getElementById('todoStatTotal');
    const statsPending=document.getElementById('todoStatPending');
    const statsDone=document.getElementById('todoStatDone');
    if(statsTotal) statsTotal.textContent=totalCount;
    if(statsPending) statsPending.textContent=pendingCount;
    if(statsDone) statsDone.textContent=doneCount;
    updateTodoBadge();

    if(todos.length===0){
      listEl.innerHTML=`<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">${_todoFilter==='all'?L('अभी कोई काम नहीं है','No tasks yet'):L('इस category में कुछ नहीं','Nothing in this category')}</div></div>`;
      return;
    }

    listEl.innerHTML = todos.map(t => renderTodoCard(t)).join('');
  }catch(e){
    listEl.innerHTML='<div class="empty"><div class="empty-icon">❌</div><div class="empty-text">लोड नहीं हो सका</div></div>';
  }
}

function renderTodoCard(t){
  const today=new Date(); today.setHours(0,0,0,0);
  let dueBadge='';
  if(t.dueDate&&!t.done){
    const due=new Date(t.dueDate); due.setHours(0,0,0,0);
    const diff=Math.round((due-today)/(1000*60*60*24));
    if(diff<0) dueBadge=`<span class="todo-due overdue">⚠️ ${Math.abs(diff)}d पहले था</span>`;
    else if(diff===0) dueBadge=`<span class="todo-due today">🔥 आज</span>`;
    else if(diff<=3) dueBadge=`<span class="todo-due upcoming">${diff}d बाकी</span>`;
    else dueBadge=`<span class="todo-due normal">📅 ${new Date(t.dueDate).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'})}</span>`;
  }

  const prioMap={high:'🔴 Urgent',medium:'🟡 Normal',low:'🟢 Low'};
  const canEdit = isAdmin() || isMgr() || t.createdBy===SESSION.empId;
  const imgs = t.images||[];

  return `<div class="todo-card priority-${t.priority||'medium'}${t.done?' done-card':''}" id="tcard-${t.id}">
    <div class="todo-top">
      <div class="todo-check${t.done?' checked':''}" onclick="toggleTodoDone('${t.id}',${!t.done})" role="checkbox" aria-checked="${t.done}" tabindex="0">
        ${t.done?'✓':''}
      </div>
      <div class="todo-main">
        <div class="todo-title${t.done?' striked':''}">${escHtml(t.title)}</div>
        ${t.desc?`<div class="todo-desc">${escHtml(t.desc)}</div>`:''}
        <div class="todo-meta-row">
          <span class="todo-priority ${t.priority||'medium'}">${prioMap[t.priority||'medium']}</span>
          ${t.assignedTo?`<span class="todo-assign">👷 ${escHtml(t.assignedTo)}</span>`:''}
          ${t.section?`<span class="todo-sec-badge">${escHtml(t.section)}</span>`:''}
          ${dueBadge}
        </div>
        ${imgs.length?`<div class="todo-image-row">${imgs.map((img,i)=>`<img class="todo-img-thumb" src="${img}" alt="task image ${i+1}" onclick="openTodoImgViewer('${t.id}',${i})">`).join('')}</div>`:''}
      </div>
    </div>
    ${canEdit?`<div class="todo-actions">
      <button class="act-btn edit" style="font-size:12px;padding:9px 6px" onclick="openTodoForm('${t.id}')">✏️ Edit</button>
      <button class="act-btn del"  style="font-size:12px;padding:9px 6px" onclick="deleteTodo('${t.id}')">🗑️ Delete</button>
    </div>`:''}
    <div style="font-size:9px;color:var(--muted);margin-top:6px">
          ${t.assignedTo&&!isAdminOrMgr()?'<span style="color:#fb923c;font-weight:700">📌 '+escHtml(t.createdByName||'Admin')+' ने assign किया</span> · ':''}
          ${t.createdByName?'👤 '+escHtml(t.createdByName):''} ${t.createdAt?'· '+new Date(t.createdAt).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'}):''}
        </div>
  </div>`;
}

async function toggleTodoDone(id,done){
  try{
    await fbUpdate('todos/'+id,{done,doneAt:done?new Date().toISOString():null});
    toast(done?'✅ काम पूरा हो गया!':'↩️ वापस pending');
    renderTodo();
  }catch(e){ toast('❌ Error: '+e.message); }
}

async function deleteTodo(id){
  const ok = await confirmModal('काम Delete करें?', 'क्या आप यह task permanently delete करना चाहते हैं?', '🗑️ हाँ, Delete करें', 'रद्द करें');
  if(!ok) return;
  try{
    await fbRemoveTodo(id);
    toast('🗑️ Delete हो गया');
    renderTodo();
  }catch(e){ toast('❌ Error: '+e.message); }
}

function openTodoImgViewer(todoId,imgIdx){
  try{
    const todos=window._cachedTodos||{};
    const t=todos[todoId];
    if(!t||!t.images||!t.images[imgIdx]) return;
    const viewer=document.getElementById('todoImgViewer');
    const img=document.getElementById('todoImgViewerImg');
    if(viewer&&img){ img.src=t.images[imgIdx]; viewer.classList.add('show'); }
  }catch(e){}
}
function closeTodoImgViewer(){
  const v=document.getElementById('todoImgViewer');
  if(v) v.classList.remove('show');
}

// ── TO-DO FORM ──
function openTodoForm(editId){
  _todoFormImages=[];
  let existing={};
  if(editId && window._cachedTodos&&window._cachedTodos[editId]){
    existing=window._cachedTodos[editId];
    _todoFormImages=[...(existing.images||[])];
  }
  const emps=getEmps();
  const empOptions=emps.map(e=>`<option value="${escHtml(e.id)}|${escHtml(e.name)}" ${existing.assignedToEmpId===e.id?'selected':''}>${escHtml(e.name)} — ${escHtml(secName(e.sec))}</option>`).join('');
  const secOptions=Object.entries(SEC).map(([k,s])=>`<option value="${k}" ${existing.section===k?'selected':''}>${s.hi}</option>`).join('');

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">${editId?'✏️ काम Edit करें':'➕ नया काम जोड़ें'}</div>
    <div class="field">
      <label>काम का नाम (Title) *</label>
      <input class="inp-field" id="tdTitle" placeholder="जैसे: M-1 pump check करना है" value="${escHtml(existing.title||'')}">
    </div>
    <div class="field">
      <label>विवरण (Description)</label>
      <textarea class="inp-field" id="tdDesc" placeholder="काम का विवरण..." style="height:80px;resize:none">${escHtml(existing.desc||'')}</textarea>
    </div>
    <div class="grid2">
      <div class="field">
        <label>Priority</label>
        <select class="inp-field" id="tdPriority">
          <option value="high" ${(existing.priority||'medium')==='high'?'selected':''}>🔴 Urgent</option>
          <option value="medium" ${(existing.priority||'medium')==='medium'?'selected':''}>🟡 Normal</option>
          <option value="low" ${(existing.priority||'medium')==='low'?'selected':''}>🟢 Low</option>
        </select>
      </div>
      <div class="field">
        <label>Due Date</label>
        <input type="date" class="inp-field" id="tdDue" style="color:#fff;background:var(--card)" value="${existing.dueDate||''}">
      </div>
    </div>
    ${isAdminOrMgr()?`
    <div class="field">
      <label>किसके लिए (Assign To)</label>
      <select class="inp-field" id="tdAssign">
        <option value="">-- किसी को assign करें --</option>
        ${empOptions}
      </select>
    </div>
    <div class="field">
      <label>Section</label>
      <select class="inp-field" id="tdSection">
        <option value="">-- Section चुनें --</option>
        ${secOptions}
      </select>
    </div>`:''}
    <div class="field">
      <label>📷 Photos जोड़ें (Optional)</label>
      <div id="tdImgPreview" class="todo-img-preview-row"></div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" onclick="document.getElementById('tdCamInput').click()"
          style="flex:1;padding:12px;border:2px dashed var(--border2);border-radius:12px;
          background:transparent;color:var(--muted2);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          📸 Camera से खींचें
        </button>
        <button type="button" onclick="document.getElementById('tdImgInput').click()"
          style="flex:1;padding:12px;border:2px dashed var(--border2);border-radius:12px;
          background:transparent;color:var(--muted2);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          🖼️ Gallery से चुनें
        </button>
      </div>
      <input type="file" id="tdCamInput" accept="image/*" capture="environment" style="display:none"
        onchange="handleTodoImages(this)">
      <input type="file" id="tdImgInput" accept="image/*" multiple style="display:none"
        onchange="handleTodoImages(this)">
    </div>
    <button class="submit-btn" onclick="saveTodo('${editId||''}')">💾 Save करें</button>
    <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>
  `);
  // Render existing images
  refreshTodoImgPreview();
}

function handleTodoImages(input){
  const files=Array.from(input.files);
  if(_todoFormImages.length+files.length>5){ toast('⚠️ अधिकतम 5 photos'); return; }
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      // Compress image before storing
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const MAX=800;
        let w=img.width,h=img.height;
        if(w>MAX||h>MAX){ const r=Math.min(MAX/w,MAX/h); w=Math.round(w*r); h=Math.round(h*r); }
        canvas.width=w; canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL('image/jpeg',0.7);
        _todoFormImages.push(compressed);
        refreshTodoImgPreview();
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
  input.value='';
}

function refreshTodoImgPreview(){
  const el=document.getElementById('tdImgPreview');
  if(!el) return;
  el.innerHTML=_todoFormImages.map((img,i)=>`
    <div class="todo-img-preview">
      <img src="${img}" alt="preview">
      <button class="todo-img-preview-del" onclick="removeTodoFormImg(${i})">✕</button>
    </div>`).join('');
}

function removeTodoFormImg(idx){
  _todoFormImages.splice(idx,1);
  refreshTodoImgPreview();
}

async function saveTodo(editId){
  const title=(document.getElementById('tdTitle')?.value||'').trim();
  if(!title){ toast('⚠️ Title जरूरी है'); return; }
  const desc=(document.getElementById('tdDesc')?.value||'').trim();
  const priority=document.getElementById('tdPriority')?.value||'medium';
  const dueDate=document.getElementById('tdDue')?.value||'';
  const assignRaw=document.getElementById('tdAssign')?.value||'';
  const [assignedToEmpId, assignedTo] = assignRaw.includes('|') ? assignRaw.split('|') : ['', assignRaw];
  const section=document.getElementById('tdSection')?.value||'';

  const data={
    title, desc, priority, dueDate,
    assignedToEmpId,   // empObjId for filtering per user
    assignedTo,        // display name
    section,
    images:[..._todoFormImages],
    createdBy: SESSION.empId||SESSION.name||'',
    createdByName: SESSION.name||'',
    createdAt: editId?(window._cachedTodos[editId]?.createdAt||Date.now()):Date.now(),
    updatedAt: Date.now(),
    done: editId?(window._cachedTodos[editId]?.done||false):false,
  };

  try{
    const id = editId || ('todo_'+Date.now()+'_'+Math.random().toString(36).slice(2,7));
    await fbSetTodo(id,data);
    closeModal();
    _todoFormImages=[];
    toast(editId?'✅ काम update हो गया!':'✅ नया काम जुड़ गया!');
    renderTodo();

    // ── WhatsApp + In-app notification when assigning to someone else ──
    if(assignedToEmpId && assignedToEmpId !== SESSION.empObjId){
      try{
        const emp = getEmps().find(e => e.id === assignedToEmpId);
        // In-app notification
        await fbPush('userNotifications/'+assignedToEmpId,{
          title: editId ? '📝 काम update हुआ' : '📌 नया काम assign हुआ',
          body: title + (SESSION.name ? ' — '+SESSION.name : ''),
          read:false, at:new Date().toISOString()
        });
        // WhatsApp notification
        if(emp && emp.phone && emp.phone.length === 10){
          const prioLabel = priority==='high' ? '🔴 Urgent' : priority==='low' ? '🟢 Low' : '🟡 Normal';
          const dueFmt = dueDate ? (typeof mpFormatDate==='function'?mpFormatDate(dueDate):new Date(dueDate).toLocaleDateString()) : '';
          let waMsg = (typeof buildWAForEmp==='function')
            ? buildWAForEmp('waTaskTemplate', emp, {
                title: title, desc: (desc||'') + (section?('\n🏭 '+section):''),
                priority: prioLabel, assigner: SESSION.name||'Admin',
                due: dueFmt ? (' *'+dueFmt+'*') : ''
              })
            : ('📌 *Task*\n'+title);
          setTimeout(()=>{ openWA(emp.phone, waMsg); }, 400);
        }
      }catch(ne){ console.warn('[Todo WA notify] error:', ne); }
    }
  }catch(e){ toast('❌ Save error: '+e.message); }
}

// ════════════════════════════════════════
// USER SHIFT NOTIFICATIONS
// ════════════════════════════════════════
let _userNotifCache = [];
let _userNotifUnread = 0;

function listenUserShiftNotifications(){
  const empId = SESSION.empObjId;
  const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const myEmpCode = SESSION.empId || '';
  if(!empId && !mob) return;

  // Any logged-in user: listen loginRequests for own device_transfer + managers for team member approvals
  try{
    if(!window._loginReqListenOn){
      window._loginReqListenOn = true;
      let _lastLoginReqAlertAt = 0;
      fbListen('loginRequests', (data)=>{
        try{
          const pending = data ? Object.values(data).filter(v=>v && v.status==='pending' &&
            (v.type==='manager_login_approval' || v.type==='device_transfer')) : [];
          const mine = pending.filter(v=>{
            if(v.type==='device_transfer'){
              // Self: another device of THIS account wants to login
              return (empId && (v.empObjId===empId || v.empObjId===SESSION.empObjId)) ||
                     (myEmpCode && v.empId===myEmpCode) ||
                     (mob && (_normMobileKey(v.phone||'')===mob || _normMobileKey(v.mobile||'')===mob));
            }
            if(v.type==='manager_login_approval'){
              return (typeof isMgr==='function' && isMgr() || SESSION.role==='manager' || (typeof isAdmin==='function' && isAdmin()))
                && (typeof _isMyTeamLoginRequest==='function' ? _isMyTeamLoginRequest(v) : false);
            }
            return false;
          });
          if(mine.length){
            // Debounce alerts (listener can fire multiple times)
            const now = Date.now();
            if(now - _lastLoginReqAlertAt > 4000){
              _lastLoginReqAlertAt = now;
              const first = mine[0];
              const isSelfDevice = first.type==='device_transfer';
              const label = isSelfDevice
                ? ('New device login — Approve in Pending')
                : ((first.empName||first.phone||'Member')+' login request — open Pending');
              try{
                if(typeof Notification!=='undefined' && Notification.permission==='granted'){
                  new Notification('📱 '+(isSelfDevice?'Device login':'Login request'), { body: label, silent:false, tag:'mp-login-req' });
                }
              }catch(e){}
              try{ toast('📱 '+label); }catch(e){}
            }
            try{ if(typeof renderDeviceTransferRequests==='function') renderDeviceTransferRequests(); }catch(e){}
            try{ if(typeof renderPending==='function' && (typeof _currentTab==='undefined' || _currentTab==='pending')) renderPending(); }catch(e){}
            // Bump notif badge so user notices even if not on Pending tab
            try{
              const badge = document.getElementById('notifCount');
              if(badge){
                const n = Math.max(1, Number(badge.textContent)||0);
                badge.textContent = String(n);
                badge.style.display = 'flex';
              }
              const bell = document.getElementById('notifBtn');
              if(bell){ bell.style.display='flex'; bell.style.animation='pulse 1s infinite'; }
            }catch(e){}
          }
        }catch(e){}
      });
    }
  }catch(e){}


  const mergeNotifs = (v, prefix) => {
    const items = v ? Object.entries(v).map(([k,n])=>({...n,_key:k,_path:prefix})) : [];
    // Merge paths (empId + mobile). Prefer read:true so one marked copy clears the badge.
    const prev = _userNotifCache || [];
    const map = new Map();
    const dedupeKey = (n)=> (n.at||'')+'|'+(n.title||'')+'|'+(n.body||'')+'|'+(n.type||'')+'|'+(n.date||'');
    [...prev, ...items].forEach(n=>{
      const key = dedupeKey(n);
      const existing = map.get(key);
      if(!existing){
        map.set(key, n);
      } else {
        // Prefer read; keep both path keys for mark-all
        const prefer = (n.read && !existing.read) ? n : existing;
        const other = prefer === n ? existing : n;
        prefer._alsoPaths = prefer._alsoPaths || [];
        if(other._path && other._key){
          prefer._alsoPaths.push({ path: other._path, key: other._key });
        }
        if(n.read) prefer.read = true;
        if(existing.read) prefer.read = true;
        map.set(key, prefer);
      }
    });
    // Local "seen" set survives if Firebase mark-read once failed
    let localSeen = {};
    try{ localSeen = JSON.parse(localStorage.getItem('mp_notif_seen')||'{}'); }catch(e){}
    const merged = [...map.values()].map(n=>{
      const key = dedupeKey(n);
      if(localSeen[key]) n = {...n, read:true};
      return n;
    }).sort((a,b)=> new Date(b.at||0) - new Date(a.at||0));
    // Alert on new device login request (manager/member already logged in elsewhere)
    try{
      const prevUnread = (_userNotifCache||[]).filter(n=>!n.read && n.type==='device_login_request').length;
      const newDeviceReqs = merged.filter(n=>!n.read && n.type==='device_login_request');
      if(newDeviceReqs.length > prevUnread){
        const latest = newDeviceReqs[0];
        if(!window._lastDeviceLoginToastAt || Date.now()-window._lastDeviceLoginToastAt > 5000){
          window._lastDeviceLoginToastAt = Date.now();
          try{ toast('📱 '+(latest.title||'New device login')+' — open Pending to Approve'); }catch(e){}
          try{
            if(typeof Notification!=='undefined' && Notification.permission==='granted'){
              new Notification(latest.title||'📱 Device login', { body: latest.body||'Approve in Pending', tag:'mp-device-login' });
            }
          }catch(e){}
          try{ if(typeof renderDeviceTransferRequests==='function') renderDeviceTransferRequests(); }catch(e){}
        }
      }
    }catch(e){}
    _userNotifCache = merged;
    _userNotifUnread = merged.filter(n=>!n.read).length;
    _updateUserNotifBadge();
  };

  if(empId){
    fbListen('userNotifications/'+empId, v => mergeNotifs(v, empId));
  }
  // Also listen by mobile key (fallback when empObjId missing at write time)
  if(mob && mob !== empId){
    fbListen('userNotifications/'+mob, v => mergeNotifs(v, mob));
  }
  // Also by emp code if different
  if(myEmpCode && myEmpCode !== empId && myEmpCode !== mob){
    try{ fbListen('userNotifications/'+myEmpCode, v => mergeNotifs(v, myEmpCode)); }catch(e){}
  }
}

function _updateUserNotifBadge(){
  const badge = document.getElementById('notifCount');
  if(!badge) return;
  
  // For admin: combine pending + shift notifs
  let total = _userNotifUnread;
  if(isAdmin()){
    const pendingCount = getRegs().filter(r=>r.status==='pending').length
      + getLeaves().filter(l=>l.status==='pending').length
      + getReports().filter(r=>r.status==='pending').length;
    total += pendingCount;
  }
  
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

function openUserNotifications(){
  // Admin also sees pending tab link
  const adminLink = isAdmin() ? `<button class="act-btn approve" onclick="closeModal();goTab('pending')" style="width:100%;margin-bottom:12px;font-size:15px !important">⏳ Pending Approvals देखें</button>` : '';
  
  const items = _userNotifCache;
  
  let listHtml = '';
  if(items.length === 0){
    listHtml = '<div class="empty" style="padding:30px"><div class="empty-icon">🔔</div><div class="empty-text">कोई notification नहीं</div></div>';
  } else {
    listHtml = items.slice(0,30).map(n => {
      const isRead = n.read;
      const timeAgo = _timeAgo(n.at);
      const shiftBg = {'D':'#f59e0b','N':'#4f46e5','O':'#334155','L':'#be123c','G':'#0284c7','CO':'#92400e','HLF':'#ea580c','Ab':'#7f1d1d','H':'#ea580c','OD':'#0d9488'}[n.newShift] || '#334155';
      const oldBg = {'D':'#f59e0b','N':'#4f46e5','O':'#334155','L':'#be123c','G':'#0284c7','CO':'#92400e','HLF':'#ea580c','Ab':'#7f1d1d','H':'#ea580c','OD':'#0d9488'}[n.oldShift] || '#334155';
      const fmtD = n.date ? new Date(n.date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'}) : '';
      
      return `<div style="background:${isRead?'var(--card)':'rgba(249,115,22,.06)'};border:1px solid ${isRead?'var(--border)':'rgba(249,115,22,.25)'};border-radius:14px;padding:14px;margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:17px;font-weight:900;color:#fff">${n.title||'Shift Update'}</span>
          <span style="font-size:12px;color:var(--muted)">${timeAgo}</span>
        </div>
        <div style="font-size:15px;color:var(--muted2);line-height:1.6">${escHtml(n.body||'')}</div>
        ${n.oldShift && n.newShift ? `<div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <span style="font-size:13px;color:var(--muted)">📅 ${fmtD}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:28px;border-radius:7px;background:${oldBg};font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;color:#fff;opacity:.5">${n.oldShift||''}</span>
          <span style="font-size:14px;color:var(--muted)">→</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:28px;border-radius:7px;background:${shiftBg};font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;color:#fff">${n.newShift||''}</span>
          <span style="font-size:13px;color:var(--muted);margin-left:auto">by ${escHtml(n.changedBy||'Admin')}</span>
        </div>` : ''}
      </div>`;
    }).join('');
  }
  
  openModal(`<div class="modal-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="modal-title" style="margin-bottom:0">🔔 Notifications</div>
      ${items.filter(n=>!n.read).length > 0 ? `<button onclick="markAllNotifsRead()" style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:8px 14px;color:var(--green);font-size:13px;font-weight:700;cursor:pointer">✓ सब पढ़ा</button>` : ''}
    </div>
    ${adminLink}
    <div style="max-height:60vh;overflow-y:auto">${listHtml}</div>
    <button class="cancel-btn" onclick="closeModal()">बंद करें</button>`);
  
  // Mark visible notifications as read after 2 seconds
  setTimeout(()=>{ markAllNotifsRead(); }, 2000);
}

async function markAllNotifsRead(){
  const all = (_userNotifCache||[]).slice();
  const unread = all.filter(n=>!n.read);
  const mob = (typeof _normMobileKey==='function') ? _normMobileKey(SESSION.mobile||SESSION.uid||'') : '';
  const empId = SESSION.empObjId||'';
  if(typeof _ensureWriteAuth==='function'){ try{ await _ensureWriteAuth(); }catch(e){} }

  // Persist locally so badge stays clear after reopen even if one FB write fails
  let localSeen = {};
  try{ localSeen = JSON.parse(localStorage.getItem('mp_notif_seen')||'{}'); }catch(e){}
  const dedupeKey = (n)=> (n.at||'')+'|'+(n.title||'')+'|'+(n.body||'')+'|'+(n.type||'')+'|'+(n.date||'');

  for(const n of all){
    try{
      const paths = new Set();
      if(n._path && n._key) paths.add('userNotifications/'+n._path+'/'+n._key);
      // _path may already be full prefix without userNotifications
      if(n._path && n._key && !String(n._path).startsWith('userNotifications')){
        paths.add('userNotifications/'+n._path+'/'+n._key);
      }
      if(n._path && n._key && String(n._path).includes('/')){
        paths.add(n._path+'/'+n._key);
      }
      // Standard paths: under empObjId and under mobile (duplicates are often stored both places)
      if(empId && n._key) paths.add('userNotifications/'+empId+'/'+n._key);
      if(mob && n._key) paths.add('userNotifications/'+mob+'/'+n._key);
      if(n._alsoPaths){
        n._alsoPaths.forEach(ap=>{
          if(ap.path && ap.key) paths.add('userNotifications/'+ap.path+'/'+ap.key);
        });
      }
      if(n._adminKey) paths.add('adminNotifications/'+n._adminKey);
      for(const p of paths){
        try{ await fbUpdate(p, {read:true}); }catch(e){}
      }
      n.read = true;
      localSeen[dedupeKey(n)] = 1;
    }catch(e){}
  }

  // Sweep entire trees under my keys (covers keys not in cache / wrong _key)
  try{
    const markTree = async (base)=>{
      if(!base) return;
      const data = await fbGet('userNotifications/'+base)||{};
      for(const [k,v] of Object.entries(data)){
        if(v && !v.read){
          try{ await fbUpdate('userNotifications/'+base+'/'+k, {read:true}); }catch(e){}
        }
      }
    };
    await markTree(empId);
    if(mob && mob!==empId) await markTree(mob);
  }catch(e){}

  try{
    // Keep last ~200 seen keys
    const keys = Object.keys(localSeen);
    if(keys.length > 200){
      keys.slice(0, keys.length-200).forEach(k=> delete localSeen[k]);
    }
    localStorage.setItem('mp_notif_seen', JSON.stringify(localSeen));
  }catch(e){}

  try{
    if(_userNotifCache) _userNotifCache.forEach(n=>{ n.read=true; });
    _userNotifUnread = 0;
    const badge = document.getElementById('notifCount');
    if(badge){ badge.textContent=''; badge.style.display='none'; }
    const bell = document.getElementById('notifBtn');
    if(bell){ bell.classList.remove('has-unread'); bell.style.animation=''; }
  }catch(e){}

  try{
    if(isAdmin()||isMgr()){
      const an = await fbGet('adminNotifications')||{};
      for(const [k,v] of Object.entries(an)){
        if(v && !v.read) try{ await fbUpdate('adminNotifications/'+k,{read:true}); }catch(e){}
      }
    }
  }catch(e){}
}

function _timeAgo(dateStr){
  if(!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff/60000);
  if(mins < 1) return 'अभी';
  if(mins < 60) return mins + ' मिनट पहले';
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return hrs + ' घंटे पहले';
  const days = Math.floor(hrs/24);
  if(days < 7) return days + ' दिन पहले';
  return new Date(dateStr).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'});
}

async function pushShiftNotification(empObjId, empName, date, oldShift, newShift, changedBy){
  try{
    const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
    const shiftNames = {D:'Day',N:'Night',A:'A',B:'B',C:'C',O:'Off',L:'Leave',G:'General','C/O':'C-Off',CO:'C-Off',HLF:'Half Day',Ab:'Absent',GP:'Gate Pass',H:'Holiday',OD:'Other Dept'};
    const body = `${fmtD} को आपकी shift ${shiftNames[oldShift]||oldShift} से ${shiftNames[newShift]||newShift} में बदली गई`;
    const payload = {
      type: 'shift_change',
      title: '📋 Shift बदली गई',
      body,
      date,
      oldShift,
      newShift,
      changedBy: changedBy || SESSION.name || 'Admin',
      read: false,
      at: new Date().toISOString()
    };
    if(empObjId) await fbPush('userNotifications/'+empObjId, payload);
    // Also by phone so mobile-login members receive it
    try{
      const emp = getEmps().find(e=>e.id===empObjId);
      const mob = _normMobileKey(emp && (emp.phone||emp.mobile));
      if(mob && mob !== empObjId) await fbPush('userNotifications/'+mob, payload);
    }catch(e2){}
  }catch(e){ console.warn('[pushShiftNotif] error:', e.message); }
}

// ════════════════════════════════════════
// PWA — Install + Service Worker
// ════════════════════════════════════════
function initPWA(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').then(reg=>{
      console.log('SW registered:', reg.scope);

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if(refreshing) return;
        if(sessionStorage.getItem('mp_sw_pending_reload') === '1'){
          sessionStorage.removeItem('mp_sw_pending_reload');
          refreshing = true;
          // Re-bind integrity token BEFORE reload so boot does not log the user out
          try{ writeIntegrityToken(); }catch(e){}
          try{ localStorage.setItem('mp_int_ok','1'); }catch(e){}
          window.location.reload();
        }
      });

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if(!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
            // At most one auto-refresh per tab session
            if(sessionStorage.getItem('mp_sw_update_done') === '1') return;
            sessionStorage.setItem('mp_sw_update_done', '1');
            sessionStorage.setItem('mp_sw_pending_reload', '1');
            try{ writeIntegrityToken(); }catch(e){}
            try{ localStorage.setItem('mp_int_ok','1'); }catch(e){}
            try{ newWorker.postMessage('SKIP_WAITING'); }catch(e){}
            try{ toast('🔄 New version available — refreshing...'); }catch(e){}
            setTimeout(() => {
              if(sessionStorage.getItem('mp_sw_pending_reload') === '1'){
                sessionStorage.removeItem('mp_sw_pending_reload');
                try{ writeIntegrityToken(); }catch(e){}
                window.location.reload();
              }
            }, 3000);
          }
        });
      });

      setTimeout(() => {
        try{ setInterval(() => { reg.update().catch(()=>{}); }, 30 * 60 * 1000); }catch(e){}
      }, 120000);
    }).catch(e=> console.log('SW error:', e));
  }
  try{ _mpInitInstallUi(); }catch(e){ console.warn('install UI', e); }
}

let _pwaPrompt = null;

/** Sync deferred prompt from early <head> capture */
function _mpSyncPwaPrompt(){
  if(window.__pwaDeferredPrompt){
    _pwaPrompt = window.__pwaDeferredPrompt;
  }
  return _pwaPrompt;
}

window._onPwaPromptReady = function(e){
  _pwaPrompt = e || window.__pwaDeferredPrompt;
  try{ _mpRefreshInstallButtons(); }catch(x){}
};

function _mpIsPwaInstalled(){
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
      || document.referrer.includes('android-app://');
}

function _mpRefreshInstallButtons(){
  const installed = _mpIsPwaInstalled();
  const btn = document.getElementById('pwaInstallBtn');
  const loginBtn = document.getElementById('loginPwaBtn');
  if(btn) btn.style.display = installed ? 'none' : 'flex';
  if(loginBtn) loginBtn.style.display = installed ? 'none' : 'flex';
}

function showInstallBanner(){
  _mpRefreshInstallButtons();
}

function hideInstallBanner(){
  const b = document.getElementById('pwaBanner');
  if(b) b.style.display = 'none';
}

/**
 * Tap Install → native browser install dialog.
 * Uses early-captured beforeinstallprompt when available.
 */
async function triggerPWAInstall(){
  _mpSyncPwaPrompt();

  if(_mpIsPwaInstalled()){
    toast('✅ App पहले से installed है!');
    _mpRefreshInstallButtons();
    return;
  }

  // Wait a bit if event not yet received (slow SW / first load)
  if(!_pwaPrompt){
    toast('⏳ Install तैयार हो रहा है...');
    for(let i = 0; i < 20 && !_pwaPrompt; i++){
      await new Promise(r => setTimeout(r, 150));
      _mpSyncPwaPrompt();
    }
  }

  if(_pwaPrompt){
    try{
      const promptEvent = _pwaPrompt;
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if(result && result.outcome === 'accepted'){
        toast('✅ App install हो रही है...');
        _pwaPrompt = null;
        window.__pwaDeferredPrompt = null;
        _mpRefreshInstallButtons();
        hideInstallBanner();
      } else {
        toast('Install रद्द किया — ऊपर address bar में Install भी try करें');
        // Event can only be used once
        _pwaPrompt = null;
        window.__pwaDeferredPrompt = null;
      }
      return;
    }catch(err){
      console.warn('[PWA] prompt failed', err);
      _pwaPrompt = null;
      window.__pwaDeferredPrompt = null;
    }
  }

  // No deferred prompt — Chrome often still shows Install in the address bar
  _showInstallInstructions();
}

function _showInstallInstructions(){
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInstalled = _mpIsPwaInstalled();
  if(isInstalled){
    toast('✅ App पहले से installed है! Home screen पर देखें।');
    return;
  }
  if(isIOS){
    openModal(`<div class="modal-handle"></div>
      <div class="modal-title">📲 iPhone पर Install करें</div>
      <div style="font-size:14px;line-height:2;color:var(--muted2)">
        <div>1️⃣ <b style="color:#fff">Safari</b> में यह page खोलें</div>
        <div>2️⃣ नीचे <b style="color:#fff">Share 📤</b> दबाएं</div>
        <div>3️⃣ <b style="color:#fff">Add to Home Screen</b> चुनें</div>
        <div>4️⃣ <b style="color:#fff">Add</b> दबाएं</div>
      </div>
      <button class="cancel-btn" onclick="closeModal()" style="margin-top:16px">ठीक है</button>`);
    return;
  }
  // Desktop / Android Chrome — point to browser Install chip (visible in address bar)
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📲 App Install करें</div>
    <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:800;color:#22c55e;margin-bottom:6px">⚡ सबसे आसान तरीका</div>
      <div style="font-size:13px;color:var(--text);line-height:1.6">
        Browser के <b>ऊपर address bar</b> में <b style="color:#f97316">Install</b> बटन दिख रहा है —<br>
        उसी पर एक बार टैप / क्लिक करें।
      </div>
    </div>
    <div style="font-size:13px;color:var(--muted2);line-height:1.9">
      <b style="color:#fff">अगर Install नहीं दिखे:</b><br>
      1️⃣ Chrome menu <b>⋮</b> (ऊपर right)<br>
      2️⃣ <b>Install app</b> / <b>Add to Home screen</b><br>
      3️⃣ <b>Install</b> दबाएं
    </div>
    <button class="submit-btn" onclick="closeModal();_mpRetryInstall()" style="margin-top:16px">🔄 फिर से Try करें</button>
    <button class="cancel-btn" onclick="closeModal()" style="margin-top:8px">ठीक है</button>`);
}

function _mpRetryInstall(){
  setTimeout(()=>{ try{ triggerPWAInstall(); }catch(e){} }, 300);
}

// Wire install UI when PWA bootstrap runs
function _mpInitInstallUi(){
  _mpSyncPwaPrompt();
  _mpRefreshInstallButtons();
  window.addEventListener('beforeinstallprompt', e=>{
    e.preventDefault();
    _pwaPrompt = e;
    window.__pwaDeferredPrompt = e;
    showInstallBanner();
  });
  window.addEventListener('appinstalled', ()=>{
    hideInstallBanner();
    toast('🎉 App install हो गई! Home screen पर देखें');
    _pwaPrompt = null;
    window.__pwaDeferredPrompt = null;
    _mpRefreshInstallButtons();
  });
}

// ════════════════════════════════════════
// AI COMMAND CHAT
// ════════════════════════════════════════

