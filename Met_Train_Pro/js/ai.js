// Met Train PRO — AI Expert (prompt, chat, QA_DB)
var _AI_KEY_SALT='MetTrainPRO2026';
// Daily API call limit (safety against overuse)
var _AI_DAILY_LIMIT=100;
var _AI_CALL_COUNT=0;
var _AI_CALL_DATE='';

// Decode obfuscated key
function _decK(enc,salt){
  if(!enc||enc==='')return '';
  try{
    var raw=atob(enc);
    var out='';
    for(var i=0;i<raw.length;i++){
      out+=String.fromCharCode(raw.charCodeAt(i)^salt.charCodeAt(i%salt.length));
    }
    return out;
  }catch(e){return '';}
}
// Encode key for obfuscation
function _encK(key,salt){
  var out='';
  for(var i=0;i<key.length;i++){
    out+=String.fromCharCode(key.charCodeAt(i)^salt.charCodeAt(i%salt.length));
  }
  return btoa(out);
}
// Check daily limit
function _checkDailyLimit(){
  var today=new Date().toISOString().slice(0,10);
  if(_AI_CALL_DATE!==today){
    _AI_CALL_DATE=today;
    _AI_CALL_COUNT=0;
    mtSave('ai_call_date',today);
    mtSave('ai_call_count','0');
  }
  return _AI_CALL_COUNT<_AI_DAILY_LIMIT;
}
function _incrementCallCount(){
  _AI_CALL_COUNT++;
  mtSave('ai_call_count',String(_AI_CALL_COUNT));
}
// Init: load key + call count
(function(){
  // Try encoded key first
  if(_AI_KEY_ENC&&_AI_KEY_ENC!==''){
    _aiAPIKey=_decK(_AI_KEY_ENC,_AI_KEY_SALT);
  }
  // Fallback to localStorage
  if(!_aiAPIKey||_aiAPIKey.length<10){
    _aiAPIKey=mtLoad('ai_api_key')||'';
  }
  // Load daily counter
  _AI_CALL_DATE=mtLoad('ai_call_date')||'';
  _AI_CALL_COUNT=parseInt(mtLoad('ai_call_count')||'0',10);
})();
var _pdfCache={};

// ── PDF KNOWLEDGE LOOKUP SYSTEM ──
var PDF_BASE='https://glmsmp.vercel.app/MetPro/MetPro/';
var PDF_INDEX=[
  {f:'manual-1.pdf',k:'vacuum system pump busch cobra aerzen roots diffusion varian cryogenic polycold brookes pump chain roughing backing high vacuum valve vv7 vv10 pressure gauge pirani penning cold cathode baratron mbar torr pumpdown sequence standby eco'},
  {f:'manual-2.pdf',k:'vacuum system pump diffusion oil silicone cvc startup shutdown hold vent venting sequence valve diagram'},
  {f:'manual-3.pdf',k:'evaporation evaporator boat ceramic source aluminium wire feeder stepper motor shutter viewing flap strobe release agent boron nitride graphite copper contact block busbar thyristor power supply warmup new old boat temperature ramp'},
  {f:'manual-4.pdf',k:'winding mechanism web path roller unwind rewind drum dtr spreader load cell tension drive cork draw substrate threading'},
  {f:'Manual-5-1.pdf',k:'winding operation tension set point feedback drive system line speed acceleration deceleration'},
  {f:'Manual-5-1-1-2.pdf',k:'winding chucking roll loading shaft spline bearing support'},
  {f:'Maintenance_Manual-1.pdf',k:'safety introduction machine overview specifications dimensions weight cooling water compressed air electrical connection noise level hazard ppe protective equipment'},
  {f:'Maintenance_Manual-2.pdf',k:'vacuum system detailed pump busch cobra nc 630 dry screw aerzen gm2000 gl8000 mechanical booster roots varian nhs diffusion oil silicone heating element heater band diffusion pump cold trap cryogenic coil polycold refrigerator maxcool pump cycle monitoring gauge pirani penning cold cathode convectron baratron eco vacuum'},
  {f:'Maintenance_Manual-3.pdf',k:'evaporation process detailed boat ceramic source wire feeder aluminium evaporator contact block copper busbar thyristor power supply warmup ramp new old viewing flap strobe shutter operation open close speed'},
  {f:'Maintenance_Manual-4-1.pdf',k:'wire feeder detailed stepper motor drive wheel groove guide tube spout clamp spring spool aluminium wire feed rate base speed checking low wire levels changing spool'},
  {f:'Maintenance_Manual-4-2.pdf',k:'inline monitor hawkeye optical density od resistance ohms square light transmission probe sensor deposition control auto manual standby optimum set point wire feed output copper contact block replacement water isolation source height adjustment evaporator drum distance'},
  {f:'Maintenance_Manual-5-1-1-1-4.pdf',k:'roll loading unloading crane hoist sling chuck chucking operation spline engagement bearing holder swing clamp toggle clip substrate roll handling'},
  {f:'Maintenance_Manual-5-1-1-5-9.pdf',k:'chucking interlock sensor proxy switch spline home position non driven chuck wear checking safety'},
  {f:'Maintenance_Manual-5-1-2.pdf',k:'reel shaft core support 152mm 6 inch mechanical expanding cardboard plastic metallic centralizing roll measurement threading substrate web path diagram roller description direction underwind overwind diameter measurement layarm reset get diameter'},
  {f:'Maintenance_Manual-5-2.pdf',k:'tension running set point pet bopp nylon cpp newton linear taper profile rewind tension curve rewind profile recipe setup overview process web source gas wedge winding unwinder rewinder rollers deposit plasma configuration favourites all recipe edit save delete load machine navigation'},
  {f:'Maintenance_Manual-6.pdf',k:'drive system detailed draw roller master cvd1 cooled process drum dtr1 wcr dtr2 ebonite draw mode torque mode closed loop open loop speed feedback roller speed tension feedback monitoring set point actual operating parameters unwind diameter gain settings responsive unstable cpd ldpe bopp paper diagnose drives stability web drive inch function winding control principles load cell carbon fibre lightweight transducer rewind layarm assembly gap contact mode movement limitation web break detection fast stop auto slowdown end roll sensing spreader cut bowed bow type'},
  {f:'Maintenance_Manual-7.pdf',k:'sidelay oscillation unwind rewind movement drum cleaner foot switch hand switch high speed web threader motorised belt tie tape knot rewind sidelay automatic crane bonfanti interface'},
  {f:'Maintenance_Manual-8.pdf',k:'albond alubond alox aluminium oxide process reactive gas oxygen argon mfc mass flow controller gas delivery safety fire hazard ppe flame retardant respirator goggles beryllium copper spark proof tool waste storage steel drum 6mm hole vent disposal recycle vacuum cleaner combustible dust hardware hawkeye inline monitor wire feed gas panel distribution shield temperature thermocouple 250 venting vv10c cobra pump exhaust dilution baratron source height cleaning method personal protective equipment ppE'},
  {f:'Maintenance_Manual-9.pdf',k:'plasma treater pre-treatment ac magnetron electrode process gas argon nitrogen oxygen mixed pressure 4e-2 8e-2 mbar mfc mass flow controller gas control pressure mode flow mode power supply water cooling burn in procedure cleaning electrode arcing arc voltage current anti backside shield focusing impedance high oxygen safety exhaust dilution 23 percent operational sequence flowchart startup pumpdown vent chucking unchucking standard aluminium alubond shutdown web break e-stop g-stop'},
  {f:'Maintenance_Manual-10.pdf',k:'machine specification technical data dimensions weight configuration options'},
  {f:'Maintenance_Manual-11.pdf',k:'cleaning schedule between runs shift weekly evaporation source coating area winding mechanism viewing window plasma electrode general cleaning disposal waste pump oil lubricant aluminium oxide hazardous diagnostic interface hmi vacuum pumpdown polycold cryogenerator plasma source thyristor wire feeder drives monitor services water pressure flow temperature network profibus asi chiller process drum cooling'},
  {f:'Maintenance_Manual-12.pdf',k:'preventive maintenance pm schedule task equipment daily weekly monthly quarterly bi-annual annual'},
  {f:'Maintenance_Manual-13-1.pdf',k:'hmi touch screen login password operator supervisor maintenance access level soft keyboard usb chiller unit glycol water coolant hydrometer specific gravity freezing point draining filling air system regulator pneumatic water system manifold pressure sensor flow coating shield drum edge shield width adjustment sine wave blanking plate graphite tape water cooled cleaning lowering raising lockout padlock'},
  {f:'Maintenance_Manual-13-2.pdf',k:'coating shutter operation open close speed minimum cylinder pneumatic guide rail roller gearbox cable lifting mechanism alignment'},
  {f:'Maintenance-Manual-13-2-1.pdf',k:'shutter maintenance detailed guide rail roller cylinder gearbox breather oil replacement wire rope cable'},
  {f:'Maintenance_Manual-13-2-2.pdf',k:'shutter alignment testing air leak snoop helium detector'},
  {f:'Maintenance_Manual-14.pdf',k:'coating shield rotational movement pivot cross shaft fork truck removal replacement wire rope cable sheave drum alignment gap 2mm conductance seal sensor proximity position reporting data logging report deposit table variation run summary out of specification efficiency cycle times source archive roll id search maintenance hmi service screen running hours counter calibration plc siemens cpu brookes cryogenerator rear hmi interface unit control buttons web start stop tension reset inch layarm diameter spreader threader crane bonfanti pushbutton panel e-stop enable'},
  {f:'Maintenance_Manual-15.pdf',k:'alarm code warning message hmi notification 312 316 322 323 325 331 332 333 335 339 340 341 344 347 348 349 350 351 353 464 profibus node water pressure flow cryogenic spreader motor threader circuit breaker chuck closed low high'},
  {f:'Maintenance_Manual-16.pdf',k:'alarm code extended profibus node failure thyristor chiller wire feeder mfc communication network error'},
  {f:'Maintenance_Manual-17.pdf',k:'troubleshooting problem solving process issue quality coating adhesion vacuum leak pressure rise outgassing substrate contamination'},
  {f:'Maintenance_Manual-18-1.pdf',k:'preventive maintenance pm task busch cobra pump aerzen booster diffusion pump oil change filter element service interval inspection'},
  {f:'Maintenance_Manual-18-2.pdf',k:'preventive maintenance pm task cryogenic polycold brookes compressor refrigerant helium leak test inspection'},
  {f:'Maintenance_Manual-19-1.pdf',k:'preventive maintenance pm task evaporation source wire feeder boat contact block insulator water cooling hose inspection'},
  {f:'Maintenance_Manual-19-2.pdf',k:'preventive maintenance pm task coating shield shutter cylinder gearbox cable rope inspection cleaning'},
  {f:'Maintenance_Manual-20.pdf',k:'preventive maintenance pm task viewing window lead through electrical cable gas wedge mfc nozzle blockage motor fan encoder bearing belt guard threader gearbox lubrication grease oil schedule equipment roller spreader kickert bowed chuck sidelay screw jack plasma power supply high voltage'},
  {f:'Maintenance_Manual-21.pdf',k:'lubrication oil grease detailed type specification anderol 555 cvc silicone bml hyd10 castrol hyspin rocol j166 bp energol esso shell mobil equipment pump diffusion mechanical leadthrough gravity bottle chiller compressor gearbox bearing o-ring seal'},
  {f:'Maintenance_Manual-22.pdf',k:'spare parts bom bill of materials part number component assembly drawing quantity reel shaft bearing chuck partition seal gasket screw bolt nut washer cylinder light bracket'},
  {f:'aimcal-metallizing-technical-reference-5thed%20(1).pdf',k:'aimcal theory test method optical density od surface resistance ohms square adhesion tape test scotch 610 daf 899 peel strength barrier property oxygen water vapor transmission rate ovtr wvtr metallized film pet bopp nylon cpp substrate wire chemistry alloy oxidation spitting pinhole surface treatment corona plasma dyne level winding vacuum converting lamination pattern metallization electron beam sputtering troubleshooting methodology'},
  {f:'L06-Vacuum_Evaporation.pdf',k:'vacuum evaporation theory physics vapor pressure clausius clapeyron temperature aluminium 980 1220 evaporation rate flux deposition rate film thickness point source surface source geometry purity compound alloy dissociation electron beam resistance monitoring quartz crystal substrate cleaning v-groove tungsten boat dimpled closed source'},
  {f:'topmet_ba_P4834_20120227_Final.pdf',k:'topmet 2450 applied materials metallizer drum winding pretreatment magnetron cathode evaporator station layer thickness lms simatic s7 plc safety interlock emergency stop service key grounding rod coating window gas inlet polycold cold trap'}
];

// ── MetExp EQUIPMENT MANUALS INDEX ──
var PDF_BASE_EXP='https://raw.githubusercontent.com/vkstecho/glsmp/main/MetExp/';
var PDF_INDEX_EXP=[
  // === VACUUM PUMPS ===
  {f:'COBRA NC 0630 C (direct cooling water system) EN spdf.pdf',k:'busch cobra nc 630 screw vacuum pump dry pump installation maintenance cooling water oil change seal filter service troubleshooting roughing backing pump'},
  {f:'COBRA NC 630 B (with plate heat exchanger) EN.pdf',k:'busch cobra nc 630 plate heat exchanger vacuum pump dry screw pump'},
  {f:'Aerzen_Application_manual_00MZG1B-K202_Rev_1D.pdf',k:'aerzen roots blower mechanical booster split cage combivert control circuit frequency inverter speed control'},
  {f:'COM_3411 Manuale General Vacuum MR-VP 10K - INGLESE.pdf',k:'mero vacuum generator mr-vp 10k electronic power supply evaporation source thyristor controller'},
  {f:'COM.5110 MANUALE MR-VP 20K-CH ENG_Marked Up Drawings-MVF.pdf',k:'mero vacuum generator mr-vp 20k evaporation power supply heater controller drawings schematic'},
  {f:'COM.3411 SCHEMA GENERALE.pdf',k:'mero vacuum generator schematic general electrical diagram circuit'},
  {f:'COM.3411 SCHEMA INVERTER.pdf',k:'mero inverter schematic electrical diagram vfd frequency drive'},
  {f:'COM.3411 SCHEMA PLC.pdf',k:'mero plc schematic electrical diagram control logic'},
  // === VACUUM GAUGES & SENSORS ===
  {f:'MKS_Baratron_627Bmanual_revB[1].pdf',k:'mks baratron 627b capacitance manometer absolute pressure transducer vacuum gauge 0.1 1 10 100 1000 torr mbar calibration zeroing signal output 0-10v'},
  {f:'MKS_Micropirani_17129 - 925 Manual - REV D.pdf',k:'mks 925 micropirani vacuum pressure transducer pirani gauge thermal conductivity 1e-4 1000 torr wide range installation rs485 setpoint relay'},
  {f:'Active_Inverted_Magnetron_Gauge_D146-41-885.pdf',k:'edwards aim inverted magnetron gauge penning cold cathode high vacuum gauge 1e-9 1e-2 mbar degas bakeout ion gauge'},
  {f:'Capsule_Dial_Gauge_D356-10-880.pdf',k:'edwards capsule dial gauge vacuum mechanical pressure indicator visual'},
  {f:'Speedivalve_Hand_Valve_C331-55-885.pdf',k:'edwards speedivalve manual hand vacuum valve isolation'},
  // === MFC & GAS CONTROL ===
  {f:'MKS_Mass-Flo Controller_1179a-2179a-179aman[1].pdf',k:'mks 1179a 2179a mass flow controller mfc gas argon oxygen nitrogen flow rate sccm slm setpoint analog 0-5v calibration zero span'},
  // === THYRISTOR & POWER CONTROL ===
  {f:'AE_Thyro-A_EN_Version 11.pdf',k:'advanced energy thyro-a thyristor power controller scr phase angle full wave boat heater evaporator source power supply current voltage control pid setpoint error led fault dip switch analog input bus module'},
  // === CHILLER SYSTEM ===
  {f:'Bobst Heater Chiller - 24-80kW - IOM - r2_02Mar13-1.pdf',k:'bobst chiller heater 24kw 40kw 80kw green resource glycol ethylene coolant water temperature cooling drum dtr process installation maintenance alarm fault pump compressor refrigerant r407c r410a pressure flow'},
  {f:'Bobst Heater Chiller - 24-80kW - IOM - r2_02Mar13-2.pdf',k:'bobst chiller spare parts electrical schematic wiring diagram piping plumbing refrigerant circuit compressor condenser evaporator expansion valve'},
  {f:'Bobst Chillers (Std) - Spare parts list r2.pdf',k:'bobst chiller spare parts list component replacement'},
  {f:'24kW Chiller Rankine Spare parts list.pdf',k:'chiller 24kw rankine spare parts list component'},
  // === STEPPER MOTORS & WIRE FEEDERS ===
  {f:'stogra stepper drive.pdf',k:'stogra sers 02 06 12 stepper motor drive amplifier position control rs232 rs485 programming dip switch speed acceleration deceleration limit switch home wire feeder'},
  {f:'stogra stepper motors.pdf',k:'stogra sm 87 107 168 stepper motor winding wiring bipolar unipolar encoder brake connection colour wire'},
  {f:'Stepper Motors Catalogue.pdf',k:'stepper motor catalogue selection torque speed nema size specification'},
  // === SPREADER ROLLER ===
  {f:'kickert-spreader-roller.pdf',k:'kickert bowed roller spreader wrapping angle installation creasing slack edge centre web spreading film foil paper textile mounting adjustment apex'},
  // === VARIABLE FREQUENCY DRIVES ===
  {f:'ATV71_Installation_Manual_03_2011.pdf',k:'schneider altivar atv71 vfd variable frequency drive installation wiring power connection motor cable terminal braking resistor'},
  {f:'ATV71_Programming_Manual_SW_V6_5_05_2015.pdf',k:'schneider altivar atv71 programming parameter speed torque pid ramp acceleration deceleration fault code error diagnostic io configuration'},
  {f:'ATV71_Profibus_User_Manual_10_2009.pdf',k:'schneider altivar atv71 profibus dp communication fieldbus address ppw pcw telegram configuration'},
  {f:'ATV71_Quick_Start_Manual_S1B8698200_2016.pdf',k:'schneider altivar atv71 quick start commissioning basic setup motor nameplate'},
  {f:'ATV71_VW3A330X_Data_Sheet.pdf',k:'schneider altivar atv71 vw3a330x option card io module'},
  {f:'ATV71_VW3A340X_Data_Sheet.pdf',k:'schneider altivar atv71 vw3a340x option card encoder feedback'},
  {f:'Altivar_ATV_Hardware_Guide_04_2014.pdf',k:'schneider altivar hardware guide mounting cooling clearance rating'},
  {f:'Schneider-Altivar-312-Manual.pdf',k:'schneider altivar 312 atv312 vfd drive installation wiring parameter small motor fan pump'},
  {f:'Schneider-Altivar-312-Programming.pdf',k:'schneider altivar 312 atv312 programming parameter fault code monitoring'},
  {f:'Schneider-Altivar-312-Quick-Start.pdf',k:'schneider altivar 312 atv312 quick start setup'},
  {f:'Maintenance Manuel ATV61-71 Release V1.6 full-1.pdf',k:'schneider altivar atv61 atv71 maintenance troubleshooting repair fault diagnostics'},
  {f:'Maintenance Manuel ATV61-71 Release V1.6 full-2-1.pdf',k:'schneider altivar atv61 atv71 maintenance spare parts board replacement'},
  {f:'Maintenance Manuel ATV61-71 Release V1.6 full-2-2.pdf',k:'schneider altivar atv61 atv71 maintenance electrical drawings schematic'},
  {f:'Maintenance Manuel ATV61-71 Release V1.6 full-2-3.pdf',k:'schneider altivar atv61 atv71 maintenance component identification'},
  // === SIEMENS DRIVES ===
  {f:'SINAMICS_G120C_en-US.pdf',k:'siemens sinamics g120c vfd drive installation commissioning parameter bop basic operator panel profibus profinet motor control pid vector'},
  {f:'SINAMICS G120C_List_Manual.pdf',k:'siemens sinamics g120c parameter list p-number function group'},
  {f:'G120 Installation Manual.pdf',k:'siemens g120 installation mounting frame size power module control unit wiring terminal cable'},
  {f:'Safety_Integrated_Function_Manual_en-US[1].pdf',k:'siemens safety integrated sto ss1 safe torque off stop sil functional safety drive'},
  // === CT/NIDEC UNIDRIVE ===
  {f:'Unidrive SP Pocket Start Up Guide.pdf',k:'control techniques nidec unidrive sp quick start commissioning parameter motor nameplate auto-tune'},
  {f:'Unidrive_SP_Short_Form_Guide_Issue_3.pdf',k:'control techniques nidec unidrive sp parameter menu speed torque ramp io configuration trip code fault'},
  {f:'CT_Unidrive_SP_Advanced_User_Guide_Issue_9.pdf',k:'control techniques nidec unidrive sp advanced parameter pid loop encoder feedback drive mode closed open loop vector flux'},
  {f:'CT_Unidrive_SP_ Low_Voltage_Installation_Guide_Issue_1.pdf',k:'control techniques unidrive sp installation wiring terminal braking emc filter'},
  {f:'CT_Fieldbus_Issue_M8.pdf',k:'control techniques fieldbus communication profibus devicenet canopen ethernet modbus'},
  {f:'CTNet_User_Guide_Issue_8.pdf',k:'control techniques ctnet network communication daisy chain peer drive link'},
  {f:'890 QuickStart Manual.pdf',k:'control techniques 890 drive dc ac commissioning parameter wiring'},
  {f:'XL50_BASIC_DRIVE_MANUAL.pdf',k:'xl50 basic drive manual dc motor speed control armature field thyristor parameter commissioning'},
  {f:'SM-PROFIBUS DP-V1 User Guide.pdf',k:'sm-profibus dp v1 option module unidrive communication parameter mapping telegram'},
  {f:'SM-Profibus-DP Iss 8.pdf',k:'sm-profibus dp option module unidrive parameter address node gsd'},
  {f:'SM-Apps Mod & Motion Processors Iss 3.pdf',k:'sm-applications module motion processor programming plc function block'},
  {f:'SM-EZMotion UG IssA5.pdf',k:'sm-ezmotion motion control positioning indexing cam profile'},
  {f:'SM-Ethernet issue 6.pdf',k:'sm-ethernet tcp ip modbus communication network'},
  {f:'SM-EtherCAT iss2.pdf',k:'sm-ethercat real time fieldbus drive communication'},
  {f:'SM-CAN Issue 2.pdf',k:'sm-can canbus communication drive'},
  {f:'SM-CANopen Iss 8.pdf',k:'sm-canopen fieldbus communication pdo sdo'},
  {f:'SM-DeviceNet_Iss5b.pdf',k:'sm-devicenet fieldbus communication allen bradley'},
  {f:'SM-INTERBUS Issue 3.pdf',k:'sm-interbus fieldbus communication'},
  {f:'SM-LON iss1.pdf',k:'sm-lon lonworks building automation'},
  {f:'SM-SERCOS Issue 6.pdf',k:'sm-sercos drive communication real time'},
  {f:'SM-Register UG Iss2.pdf',k:'sm-register option module web tension control sectional printing'},
  {f:'SM-SLM UG iss5.pdf',k:'sm-slm option module servo linear motor'},
  {f:'SM-Uni Enc Plus Iss 6.pdf',k:'sm-universal encoder plus feedback ssi biss sin cos resolver'},
  {f:'SM-Resolver iss4.pdf',k:'sm-resolver feedback position speed motor'},
  {f:'SM-IO Plus iss6.pdf',k:'sm-io plus analog digital input output option'},
  {f:'SM-IO 24V Protected UG iss2.pdf',k:'sm-io 24v protected digital io option'},
  {f:'SM-IO 120V iss2.pdf',k:'sm-io 120v digital io option'},
  {f:'SM-IO 32 UG Iss1.pdf',k:'sm-io 32 digital io option high density'},
  {f:'SM-I_O Lite _Timer UG iss4.pdf',k:'sm-io lite timer digital io option basic'},
  {f:'SM-PELV iss3.pdf',k:'sm-pelv safety extra low voltage'},
  {f:'SM-Keypad Installation Sheet.pdf',k:'sm-keypad display parameter menu unidrive'},
  {f:'SM-Keypad Plus Iss1.pdf',k:'sm-keypad plus display parameter copy backup'},
  // === B&R PLC / AUTOMATION ===
  {f:'B&R_X20_System_Users_Manual_Version_1_20-1-1.pdf',k:'b&r x20 plc system bus controller io module cpu backplane installation configuration'},
  {f:'B&R_X20_System_Users_Manual_Version_1_20-1-2.pdf',k:'b&r x20 plc digital analog io module specification wiring'},
  {f:'B&R_X20_System_Users_Manual_Version_1_20-1-3.pdf',k:'b&r x20 plc communication interface module fieldbus'},
  {f:'B&R_X20_System_Users_Manual_Version_1_20-2.pdf',k:'b&r x20 plc programming software automation studio'},
  {f:'B&R_X20_System_Users_Manual_Version_1_20-3-1.pdf',k:'b&r x20 plc module technical data specification'},
  {f:'B&R_X20_System_Users_Manual_Version_1_20-3-2-1.pdf',k:'b&r x20 plc module technical data wiring diagram'},
  {f:'B&R_X20_System_Users_Manual_Version_1_20-3-2-2.pdf',k:'b&r x20 plc module technical data continued'},
  {f:'B&R_X20CPx48x.pdf',k:'b&r x20 cpu cp048x processor module plc controller'},
  {f:'B&R_X20IF1063.pdf',k:'b&r x20 if1063 profibus dp master interface module'},
  {f:'B&R_X20BT9100.pdf',k:'b&r x20 bt9100 bus terminal base module'},
  {f:'B&R_X20TBxx.pdf',k:'b&r x20 terminal block wiring connector'},
  {f:'B&R_X67PS1300.pdf',k:'b&r x67 power supply remote io'},
  {f:'B&R_Compact_Flash_Card_Data_Sheet.pdf',k:'b&r compact flash cf card storage memory plc program'},
  {f:'B&R_Interconnection_Cables_X67_Data_Sheet.pdf',k:'b&r x67 cable interconnection wiring'},
  {f:'FAQ B&R CF_V01.10_ENG.pdf',k:'b&r compact flash faq troubleshooting format backup'},
  {f:'ACOPOSmicro.pdf',k:'b&r acopos micro servo drive motor control'},
  // === SIEMENS PLC / AUTOMATION ===
  {f:'ET200M_e.pdf',k:'siemens et200m distributed io profibus remote module rack'},
  {f:'ET200S.pdf',k:'siemens et200s distributed io profibus compact remote module'},
  {f:'profinet_step7_v13_function_manual_en-US_en-US.pdf',k:'siemens profinet step7 tia portal v13 configuration networking communication plc'},
  {f:'PROFIBUS Installation Guideline for Cabling and Assembly.pdf',k:'profibus cable connector assembly dp termination resistor installation wiring'},
  {f:'PROFIBUS_Installation_Guideline_for_Planning-Supplement.pdf',k:'profibus planning network topology cable length segment repeater'},
  {f:'PROFIBUS_Installation_Guideline_for_Planning.pdf',k:'profibus planning network design cable node address gsd'},
  {f:'Profibus Installation Guideline for Commissioning.pdf',k:'profibus commissioning troubleshooting diagnostic oscilloscope telegram'},
  {f:'Profibus Technology and Application.pdf',k:'profibus technology overview dp pa fms protocol application'},
  {f:'Profibus-Fastconnect plug.pdf',k:'profibus fast connect plug connector db9 sub-d wiring termination'},
  {f:'ipc227d_operating_instructions_en-US_en-US.pdf',k:'siemens ipc227d industrial pc embedded hmi touch panel computer'},
  {f:'ipc227d_quick_install_guide_DO-V2.pdf',k:'siemens ipc227d quick install mount wiring connection'},
  {f:'RS 485 Repeater.pdf',k:'rs485 repeater signal booster communication serial profibus'},
  {f:'Security for PC-based Automation.pdf',k:'security pc industrial automation network firewall protection'},
  {f:'TeleService V6.1.pdf',k:'siemens teleservice remote access diagnostic plc s7'},
  // === SIEMENS CONTACTORS & PROTECTION ===
  {f:'Siemens Sirus Contactor_S2.pdf',k:'siemens sirius contactor s2 size motor starter 3rt'},
  {f:'Siemens _3RW3038-1BB04_Soft_Start.pdf',k:'siemens 3rw soft starter motor starting current inrush'},
  {f:'Siemens_Circuit_Breakers_Type_D.pdf',k:'siemens circuit breaker type d mcb motor protection overload'},
  {f:'Siemens_MCB_Primer_EN_201601250852395217.pdf',k:'siemens mcb miniature circuit breaker selection guide curve b c d'},
  {f:'Siemens_SIRIUS_Circuit_Breaker_3RV2_en-US.pdf',k:'siemens sirius 3rv2 motor starter protector circuit breaker overload short circuit'},
  {f:'Siemens_application_manual_switching_devices_IE3_motors_en-US.pdf',k:'siemens switching devices ie3 motor contactor selection overload starter'},
  {f:'Circuit Breakers.pdf',k:'circuit breaker mcb mccb selection rating trip curve protection'},
  {f:'Safety Relay (3TK2822-3TK2823).pdf',k:'siemens 3tk2822 3tk2823 safety relay dual channel e-stop gate monitoring'},
  {f:'Safety Relay (3Tk2827, 3TK2828).pdf',k:'siemens 3tk2827 3tk2828 safety relay expansion monitoring'},
  {f:'Two-hand control unit (3TK2834).pdf',k:'siemens 3tk2834 two hand control safety relay'},
  // === IFM SENSORS ===
  {f:'IFM_Manual_AS-Interface_UK_Rel.2.2_web.pdf',k:'ifm as-interface asi bus sensor actuator network flat cable addressing master slave'},
  {f:'IFM AC2616_Asi_Interface_Installation Instructions.pdf',k:'ifm ac2616 as-interface module installation'},
  {f:'IFM_AC1218_PSU_Instructions_7390423DEESFRITPTUK.pdf',k:'ifm ac1218 power supply asi as-interface 24v'},
  {f:'IFM_AC1258_AS-Interface Power Supply.pdf',k:'ifm ac1258 as-interface power supply 8a'},
  {f:'IFM_AC5000_Data_Sheet.pdf',k:'ifm ac5000 as-interface master module plc'},
  {f:'IFM_AC5020_Data_Sheet.pdf',k:'ifm ac5020 as-interface master profibus gateway'},
  {f:'IFM_Interface_Unit_AC1375_Installation instructions.pdf',k:'ifm ac1375 interface unit as-interface'},
  {f:'IFM_Termination _7390467DEFRUK.pdf',k:'ifm termination as-interface bus cable end'},
  {f:'IFM_PT100_Temperature Sensor_TT1250.pdf',k:'ifm tt1250 pt100 temperature sensor rtd'},
  {f:'IFM_TN2531_Temperature_Sensor_704771UK.pdf',k:'ifm tn2531 temperature sensor thermocouple process'},
  {f:'IFM_Dual_Sensor_T5_Instructions_7390436DEFRUK.pdf',k:'ifm dual sensor t5 temperature monitoring'},
  {f:'IFM_SM6004_Flow_Sensor.pdf',k:'ifm sm6004 flow sensor magnetic inductive water cooling monitor'},
  {f:'IFM_LMT_Level_Sensor_0900766b80fb6a07.pdf',k:'ifm lmt level sensor liquid coolant water tank'},
  {f:'IFM_Proximity-Switch_1D2226UK.pdf',k:'ifm proximity switch inductive sensor detection metal position'},
  {f:'IFM_Progressive_Ring_Fitting_701308.pdf',k:'ifm progressive ring fitting compression tube connection'},
  {f:'IFM PA3024_Sensor_704090UK_Installation Instructions.pdf',k:'ifm pa3024 pressure sensor installation'},
  {f:'IFM_AC2516_Installation_Manual_eng.pdf',k:'ifm ac2516 asi as-interface module io'},
  {f:'ifm_Bus system AS-Interface_AC5005.pdf',k:'ifm ac5005 as-interface diagnostics monitor bus system'},
  // === FESTO PNEUMATICS ===
  {f:'Festo_Standard_Cylinders.pdf',k:'festo cylinder pneumatic actuator piston rod stroke dsbc double acting single'},
  {f:'Festo_Pressure_Regulators.pdf',k:'festo pressure regulator filter lubricator frl air treatment compressed pneumatic'},
  {f:'Festo_Proximity_Switch_data_Sheet.pdf',k:'festo proximity switch magnetic reed sensor cylinder position'},
  {f:'Festo_Asi_Equipment.pdf',k:'festo as-interface asi valve terminal pneumatic bus solenoid'},
  {f:'Festo_Asi_Interface_Unit.pdf',k:'festo as-interface interface unit gateway'},
  {f:'Festo_Connections.pdf',k:'festo push-in fitting tube connection pneumatic quick'},
  {f:'Festo_Exhaust_Flow_Control_Valve.pdf',k:'festo exhaust flow control valve speed regulate cylinder'},
  {f:'Festo_Manual_override_Tool.pdf',k:'festo manual override tool solenoid valve hand operate'},
  {f:'Festo_Oneway_Flow_Control_Valves.pdf',k:'festo one way flow control valve throttle meter-in meter-out'},
  {f:'Festo_Pressure_Switch.pdf',k:'festo pressure switch pneumatic detect air'},
  {f:'Festo_Service_Unit_Combinations.pdf',k:'festo service unit frl combination filter regulator lubricator'},
  {f:'Atomuffler_Filter_Silencer.pdf',k:'atomuffler filter silencer exhaust muffler pneumatic noise'},
  // === MECHANICAL COMPONENTS ===
  {f:'ETP_EXPRESS_Technical_Manual.pdf',k:'etp express hydraulic clamping hub shaft locking bush keyless connection torque mounting instruction'},
  {f:'ETP-EXPRESS-MOUNTING-INSTRUCTIONS.pdf',k:'etp express mounting installation tightening torque nm procedure'},
  {f:'ETP-EXPRESS-PRODUCT-SHEET.pd.pdf',k:'etp express product specification dimension tolerance'},
  {f:'Svecom_Mechanical_Shafts.pdf',k:'svecom mechanical expanding shaft reel core chuck key dismantle assembly winding 152mm 6inch'},
  {f:'Svecom_Mechanical_Shaft_3D_Drawing.pdf',k:'svecom shaft 3d drawing dimension'},
  {f:'Mechanical_Shaft_Data_Sheet.pdf',k:'mechanical shaft data specification dimension drawing expanding'},
  {f:'rotec_Bridge_Adapter_EN.pdf',k:'rotec bridge adapter coupling shaft connection alignment'},
  {f:'rotec_Unifit_Adapter_EN.pd.pdf',k:'rotec unifit adapter shaft coupling universal'},
  {f:'Source_Strobe_Coupling_Cat.pdf',k:'source strobe coupling catalogue oldham jaw flexible drive connection'},
  {f:'Source_Strobe_Coupling_Installation_Instructions.pdf',k:'source strobe coupling installation alignment procedure tightening'},
  {f:'flexible_Couplings.pdf',k:'flexible coupling elastomeric jaw oldham beam bellows shaft misalignment torque selection guide'},
  {f:'KTR_Clamping Nut_Mounting Instructions.pdf',k:'ktr clamping nut mounting shaft locking'},
  {f:'KTR_Radex-N_Coupling.pdf',k:'ktr radex-n coupling flexible polyurethane spider jaw'},
  {f:'Ruland_Nomar_Catalogue.pdf',k:'ruland nomar shaft collar clamp coupling rigid beam bellows'},
  {f:'Pull Action Latch Clamps.pdf',k:'pull action latch clamp toggle hold down quick release'},
  // === BEARINGS & LINEAR ===
  {f:'SKF_Deep_Groove_Ball_Bearings.pdf',k:'skf deep groove ball bearing 6200 6300 selection load speed lubrication clearance seal shield'},
  {f:'SKF_CARB toroidal roller bearings.pdf',k:'skf carb toroidal roller bearing self-aligning misalignment'},
  {f:'SKF_Carb.pdf',k:'skf carb bearing catalogue specification'},
  {f:'SKF_Spherical_bearings_EN.pdf',k:'skf spherical roller bearing heavy load vibration misalignment'},
  {f:'SKF_Cam followers - 148081030.pdf',k:'skf cam follower track roller needle bearing'},
  {f:'SKF_Maintenance_Products-1.pdf',k:'skf maintenance bearing heater puller grease gun tool'},
  {f:'SKF_Maintenance_Products-2.pdf',k:'skf maintenance product alignment laser belt tension'},
  {f:'SKF_Maintenance_Products-3.pdf',k:'skf maintenance condition monitoring vibration temperature sensor'},
  {f:'Super-precision angular contact ball bearings 72 D series_EN.pdf',k:'skf super precision angular contact spindle bearing high speed'},
  {f:'Four-row linear recirculating ball bearing.pdf',k:'linear ball bearing carriage rail guide recirculating'},
  {f:'Linear Guidway.pdf',k:'linear guideway rail carriage block slide'},
  {f:'HIWIN GMBH DDB ballnut.pdf',k:'hiwin ball screw nut precision linear motion'},
  {f:'INA Linear Technology.pdf',k:'ina linear technology bearing guide rail shaft support'},
  // === ENCODERS ===
  {f:'Rotary encoders Oct2009.pdf',k:'rotary encoder incremental absolute optical magnetic shaft speed position feedback pulse ppr resolution'},
  {f:'ATM60-90_3017.pdf',k:'sick atm60 atm90 absolute encoder multiturn singleturn ssi profibus'},
  {f:'online_data_sheet_ATM60-AAM12X12_en_20140319_1443.pdf',k:'sick atm60 absolute encoder datasheet specification'},
  // === FLOW & LEVEL ===
  {f:'Kobold_Flowmonitor_DF-WM.pdf',k:'kobold df-wm flow monitor switch water cooling detect'},
  {f:'Glass Variable Area Flowmeters.pdf',k:'variable area flowmeter rotameter glass tube flow measurement water air gas'},
  {f:'Float-Type Flow Meter.pdf',k:'float flow meter indicator water cooling circuit visual check'},
  // === POWER SUPPLY ===
  {f:'Murr_Elecktronik_Emparro_PSU_85692_ina_4_14.pdf',k:'murr elektronik emparro power supply 24v dc din rail'},
  {f:'Murr_Elektronic_52001.pdf',k:'murr elektronik module relay output interface plc 24v'},
  {f:'Murr_Elektronic_85002.pdf',k:'murr elektronik power supply module 24v'},
  {f:'Murr_Elektronic_85004.pdf',k:'murr elektronik power supply high current'},
  {f:'Murr_Elektronic_9000-41064-0600000.pdf',k:'murr elektronik mico basic electronic circuit protection fuse module'},
  {f:'Murr_Elektronik_52501.pdf',k:'murr elektronik relay module output interface'},
  {f:'Murr_Elektronik_52511.pdf',k:'murr elektronik relay module optocoupler isolation'},
  {f:'Mico_Basic 4_6_Unit_9000-41064-0600000_Version1_5.pdf',k:'murr mico basic electronic circuit breaker protection 24v dc channel'},
  {f:'RS_282-524_Power Supply.pdf',k:'rs power supply 24v 12v din rail industrial'},
  {f:'Meanwell_MDR-100-spec.pd.pdf',k:'meanwell mdr-100 power supply din rail 24v 100w'},
  {f:'Switch Mode Power Supply.pdf',k:'switch mode power supply smps ac dc conversion industrial'},
  {f:'Data_Sheet_IS_VPU_II.pdf',k:'surge protection spd voltage transient overvoltage power line'},
  {f:'Surge Suppression Module.pdf',k:'surge suppression module varistor protection'},
  {f:'Surge protection - Data Sheet.pdf',k:'surge protection data specification lightning power'},
  {f:'14CE914CE Series Miniature Enclosed_XP-4040-5-ML.pdf',k:'xp power supply miniature enclosed pcb mount'},
  // === RELAYS & SWITCHES ===
  {f:'G2RS_Relay_0900766b8137b9cc.pdf',k:'omron g2rs relay dpdt 8 pin socket base 24v 230v'},
  {f:'G2R_General_Purpose_Relay_0900766b8137b9d9.pdf',k:'omron g2r general purpose relay spdt dpdt'},
  {f:'G3R_IO_Relays_0900766b8137b9d0.pdf',k:'omron g3r io relay solid state module interface'},
  {f:'Wago_788-312_Relay_Socket.pdf',k:'wago 788-312 relay socket base din rail'},
  {f:'Allen_Bradley_Safety_Relay_0900766b813dd973.pdf',k:'allen bradley safety relay guardmaster dual channel emergency stop'},
  {f:'Telemecanique_Mini_Control_Relays_1643496.pdf',k:'schneider telemecanique mini control relay ca2 ca3'},
  {f:'Telemecanique_F_Series_Coils_0900766b80a59616.pdf',k:'schneider telemecanique coil contactor relay 24v 110v 230v'},
  {f:'Telemecanique_User_Man_LC1F115_1250_1355817_01a55-17.pd.pdf',k:'schneider telemecanique lc1f contactor large heavy duty motor'},
  {f:'Telemecanique_XAL-SZ1E  Data Sheet.pdf',k:'schneider telemecanique xal pushbutton pendant station control'},
  {f:'Klockner_Moellar_Isolator_Switch_1801036.pdf',k:'klockner moeller isolator switch disconnector motor protection'},
  {f:'SIRCO Load break switches.pdf',k:'sirco load break switch isolator disconnector socomec'},
  {f:'Door_Operated_Switch_SZ_4127_010.pdf',k:'door operated switch interlock safety panel cabinet rittal'},
  {f:'Berstein_Footswitch_1825130.pdf',k:'bernstein footswitch foot pedal operator drum cleaner'},
  {f:'Magnetic _Switch_3SE6604-2BA01.pdf',k:'siemens 3se6604 magnetic switch interlock safety door guard'},
  {f:'Switching_Magnet_3SE6704-3BA.pdf',k:'siemens 3se6704 switching magnet actuator interlock safety'},
  // === MOTORS ===
  {f:'BMH0702P01F1A_Motor_Datasheet.pdf',k:'schneider bmh servo motor brushless compact'},
  {f:'Separately Ventilated Three Phase Motors.pdf',k:'motor three phase ventilated forced cooling ie2 ie3 induction'},
  {f:'Synchronous motors 1FK7.pdf',k:'siemens 1fk7 synchronous servo motor permanent magnet'},
  {f:'Alpha gearbox lp-lpb.pdf',k:'alpha gearbox lp lpb planetary reducer servo motor'},
  {f:'Planetry_Gearbox_Instruction_Manual.pdf',k:'planetary gearbox installation mounting lubrication maintenance reducer'},
  {f:'Thermistor Motor Protection Tripping Units.pdf',k:'thermistor motor protection ptc temperature winding overheat trip'},
  // === VALVES & PLUMBING ===
  {f:'ashworth - albion 54 series full bore ball valve.pdf',k:'ashworth albion 54 ball valve full bore isolation water cooling pipe'},
  {f:'Bray_ACG Solenoid Valve.pdf',k:'bray acg solenoid valve pneumatic control air water'},
  {f:'Bray_Actuator S92-93 OM.pdf',k:'bray actuator s92 s93 pneumatic valve quarter turn butterfly'},
  {f:'Series_30_31_valves.pdf',k:'series 30 31 valve pneumatic solenoid directional control'},
  {f:'4233 A-LOK Tube Fittings1.pdf',k:'a-lok tube fitting compression stainless steel pipe connection swagelok'},
  {f:'MS-01-167_Hoses.pdf',k:'swagelok hose flexible connection high pressure tube fitting'},
  {f:'PN16 Cast Iron Strainer.pdf',k:'pn16 cast iron strainer filter water pipe debris protection'},
  // === SEALS & O-RINGS ===
  {f:'Merkel_Omegat_OMS_MR_Data_sheet..pdf',k:'merkel omegat oms mr seal o-ring vacuum rotary shaft'},
  {f:'Simprit_Seal_Details.pdf',k:'simprit seal o-ring vacuum hydraulic material viton nbr epdm silicone'},
  {f:'Simprit_simmerings_2010.pdf',k:'simprit simmering oil seal radial shaft lip'},
  // === CCTV & MONITORING ===
  {f:'ApolloHDSeriesDVRUsersManual_001updated.pdf',k:'apollo hd dvr cctv recorder camera surveillance security'},
  {f:'iApolloHDRTLiteiApolloHDRTIOUsersGuide06-2013.pdf',k:'iapollo hd dvr cctv recorder network remote viewing security camera'},
  {f:'ESP_CCTV_Monitor_Manual.pdf',k:'esp cctv monitor screen display security camera'},
  {f:'Genie_96 SERIES Manual.pdf',k:'genie 96 cctv camera series manual'},
  {f:'Genie_W96MDV CCTV_Series Datasheet.pdf',k:'genie w96mdv cctv camera dome vandal proof'},
  // === TOUCH PANEL / HMI ===
  {f:'ELO_Intellitouch_3.2.pdf',k:'elo intellitouch screen controller touch panel hmi display'},
  {f:'ELO_LCD OPEN-FRAME TOUCHMONITORe481511_b.pd.pdf',k:'elo lcd open frame touch monitor hmi panel screen'},
  // === NETWORKING ===
  {f:'Harting_ETHERNET_SWITCH_8_PORT 10100Mbps_.pdf0900766b81313430.pdf',k:'harting ethernet switch 8 port 10/100 industrial network'},
  {f:'Harting_Ha_Vis_eCon_Ethernet_Switch_1719969.pdf',k:'harting ha-vis econ ethernet switch industrial managed'},
  {f:'HMS_Anybus_ABC-PDP User Manual 2_02.pdf',k:'hms anybus abc-pdp profibus dp gateway converter protocol'},
  // === CONNECTORS ===
  {f:'Harting H6 Socket_09330062601.pdf',k:'harting h6 socket connector heavy duty industrial han'},
  {f:'LMF_LMG_Connectors_catalogue.pdf',k:'lmf lmg connector catalogue industrial plug socket'},
  // === ADHESIVES & INSULATION ===
  {f:'520_Adhesive_MSDSArmaflex520AUS.pdf',k:'armaflex 520 adhesive msds insulation glue rubber foam pipe'},
  {f:'How_To_Insulate_Pipes_And_Fittings.pdf',k:'insulation pipe fitting thermal foam rubber armaflex installation guide'},
  {f:'Brazing Tools.pdf',k:'brazing tools soldering copper pipe refrigeration joining'},
  {f:'Cold_Work_Application_Guidance.pdf',k:'cold work application guidance insulation chiller pipe low temperature'},
  {f:'Refrigeration_and_Installation_Guide.pdf',k:'refrigeration installation guide pipe copper brazing insulation chiller compressor'},
  {f:'DIEKAN 1640 Data _ English.pdf',k:'diekan 1640 insulation data thermal pipe'},
  {f:'DIEKAN 1640 Safety _  English.pdf',k:'diekan 1640 safety data sheet msds insulation'},
  // === SAFETY & ENCLOSURES ===
  {f:'Rittal Assembly and operating instructions.pdf',k:'rittal cabinet enclosure assembly mounting panel'},
  {f:'Rittal Assembly instructions.pdf',k:'rittal enclosure assembly installation hardware'},
  {f:'Rittal Info sheet.pdf',k:'rittal enclosure specification ip rating cooling'},
  {f:'HYGARD Polycarbonate Laminates.pdf',k:'hygard polycarbonate laminate safety glazing viewing window protection'},
  {f:'Makrolon_Hygard_BR_750_EN.pdf',k:'makrolon hygard br 750 polycarbonate bullet resistant safety glazing'},
  {f:'Klaxon_Beacon_0900766b8118d42f.pdf',k:'klaxon beacon light alarm warning visual indicator tower'},
  {f:'Roshni_Sounder_0900766b80689a12.pdf',k:'roshni sounder alarm audible buzzer warning horn'},
  {f:'GENERAL SAFETY, ASSEMBLY, OPERATING, USE,AND MAINTENANCE INSTRUCTIONS.pdf',k:'general safety assembly operating maintenance instructions industrial equipment'},
  {f:'CE certificate.pdf',k:'ce certificate conformity declaration safety directive'},
  // === MISCELLANEOUS ===
  {f:'Belt_Drive _PM_Manual.pdf',k:'belt drive pm preventive maintenance timing v-belt tension alignment pulley'},
  {f:'Installation_And_Maintenance.pdf',k:'installation maintenance general guide procedure industrial equipment'},
  {f:'Installation_Instructions_From_Website_2016.pdf',k:'installation instructions guide general 2016'},
  {f:'Igus_Cable_Coiler_Design_Guidelines.pdf',k:'igus cable coiler chain design guideline drag energy routing'},
  {f:'Hobut Din Range Panel Meters.pdf',k:'hobut din panel meter ammeter voltmeter analog display'},
  {f:'Hobut_14_Series_Current_Transformer.pdf',k:'hobut 14 current transformer ct measurement ammeter'},
  {f:'Specification GE_-Sheet-Proline-Multi-Volt-T12-Ballast.pdf',k:'ge proline multi volt t12 ballast fluorescent lighting'},
  {f:'REO Braking- and charging resistors.pdf',k:'reo braking resistor charging dynamic drive vfd regenerative'},
  {f:'Arcoflex_314_data_sheet.pdf',k:'arcoflex 314 flexible coupling bellows precision servo'},
  {f:'DGS60_65_66_E.pdf',k:'dgs60 dgs65 dgs66 deublin rotary union joint water coolant drum dtr shaft'},
  {f:'PFEA111-112.tmp.pdf',k:'abb pfea111 pfea112 tension electronics amplifier load cell signal web winding'},
  {f:'CG16K capsule dial gauge datasheet - D05900895 C.pdf',k:'cg16k capsule dial gauge edwards vacuum visual indicator'},
  {f:'Datasheet PlexTec Particle Filter - GB.pdf',k:'plextec particle filter dust air exhaust vacuum pump protection'},
  {f:'OpMan Tracker 505-EN (98-1240).pdf',k:'tracker 505 web guide edge sensor optical photo position control'},
  {f:'J6 Series.pdf',k:'j6 series printer network label barcode industrial'},
  {f:'J6D_PSW.pdf',k:'j6d psw printer software driver setup'},
  {f:'Brother_Network_User_Guide_cv_hl3140cw_eng_net.pdf',k:'brother hl3140cw printer network setup wifi lan'},
  {f:'Brother_User_Guide_cv_hl3140cw_use_usr.pdf',k:'brother hl3140cw printer user guide operation toner'},
  {f:'Mounting instructions.pdf',k:'mounting instructions general mechanical bracket fixing'},
  {f:'Storage_&_Preservation_Guidelines_TN01175 E XA_11_08.pdf',k:'storage preservation guideline equipment motor bearing humidity protection'},
  {f:'Type 6539S-1-103.pdf',k:'type 6539s valve control proportional'},
  {f:'Application_Manual.pdf',k:'application manual technical industrial guide'},
  {f:'55 series_Repair_Instructions.pdf',k:'55 series repair instructions valve actuator maintenance'},
  {f:'755 Series DA-43-Repair_Instructions.pdf',k:'755 series repair instructions valve actuator maintenance'},
  {f:'RU 093 GB screen 13 Series 755.pdf',k:'755 series screen valve actuator data'},
  {f:'Catalogue 075-Q GB 6-12 Series 55+57.pdf',k:'catalogue 55 57 series valve actuator industrial'},
  {f:'TD170 - Iss C - Product Safety Manual Actuator, Spring and Limit Switch Box.pdf',k:'td170 actuator spring limit switch box safety manual valve'},
  {f:'825064-00-Revision 11.pdf',k:'revision 11 technical specification equipment'},
  {f:'890 QuickStart Manual.pdf',k:'control techniques 890 drive quick start commissioning dc motor'},
  {f:'AC2515.pdf',k:'ac2515 module interface component'},
  {f:'X20BM11-GER[1].pdf',k:'b&r x20bm11 bus module german'},
  {f:'X20CPUs-ENG.pdf',k:'b&r x20 cpu processor module english'},
  {f:'X20IF1063-ENG.pdf',k:'b&r x20if1063 interface profibus english'},
  {f:'ac1218.pdf',k:'ifm ac1218 power supply data as-interface'},
  {f:'bw155_12000_25_dwg.pdf',k:'bw155 drawing dimension technical'},
  {f:'cp31x.pdf',k:'cp31x siemens power supply sitop 24v'},
  {f:'drt-960.pdf',k:'drt-960 din rail terminal block power distribution'},
  {f:'e250918_a.pdf',k:'e250918 technical specification component'},
  {f:'sp1.pdf',k:'sp1 technical document specification'}
];

// Find relevant PDFs based on query keywords
function findRelevantPDFs(query){
  var q=query.toLowerCase().replace(/[?।,\.!]/g,' ');
  // Hindi to English keyword mapping for common terms
  var hiMap={
    'वैक्युम':'vacuum','पम्प':'pump','बोट':'boat','वायर':'wire','टेंशन':'tension',
    'अलार्म':'alarm','क्लीनिंग':'cleaning','सफाई':'cleaning','रोल':'roll',
    'शटर':'shutter','ड्रम':'drum','प्लाज़्मा':'plasma','प्रेशर':'pressure',
    'तापमान':'temperature','पानी':'water','तेल':'oil','ग्रीस':'grease',
    'मशीन':'machine','चिलर':'chiller','रेसिपी':'recipe','स्पीड':'speed',
    'वाइंडिंग':'winding','रिवाइंड':'rewind','अनवाइंड':'unwind',
    'एवैपोरेशन':'evaporation','डिफ्यूज़न':'diffusion','क्रायोजेनिक':'cryogenic',
    'स्प्रेडर':'spreader','थ्रेडर':'threader','लेआर्म':'layarm',
    'कॉन्टैक्ट':'contact','कॉपर':'copper','इंसुलेटर':'insulator',
    'मेंटेनेंस':'maintenance pm','सर्विस':'service maintenance',
    'स्पेयर':'spare part bom','पार्ट':'part bom spare',
    'ल्यूब':'lubrication oil grease','ऑयल':'oil lubrication',
    'डायग्नोस्टिक':'diagnostic hmi','एचएमआई':'hmi screen',
    'रिपोर्ट':'report data logging','वेब ब्रेक':'web break detection',
    'ई-स्टॉप':'e-stop emergency','जी-स्टॉप':'g-stop guard',
    'शटडाउन':'shutdown sequence','स्टार्टअप':'startup sequence',
    'एल्बॉन्ड':'albond alubond alox','एलॉक्स':'alox albond aluminium oxide',
    'ऑप्टिकल':'optical density od','ओडी':'od optical density',
    'हॉकआई':'hawkeye inline monitor','रेज़िस्टेंस':'resistance ohms',
    'पंपडाउन':'pumpdown vacuum sequence','वेंट':'vent venting sequence',
    'लीक':'leak pressure rise test helium','ओ-रिंग':'o-ring seal gasket',
    'गैस वेज':'gas wedge cooling','एमएफसी':'mfc mass flow controller',
    'ड्राइव':'drive motor vfd inverter','इन्वर्टर':'inverter vfd drive frequency',
    'कोबरा':'cobra busch pump screw','एरज़ेन':'aerzen roots booster',
    'बेयरिंग':'bearing skf roller ball','सेंसर':'sensor ifm proximity switch',
    'सिलेंडर':'cylinder festo pneumatic actuator','वाल्व':'valve solenoid pneumatic',
    'पावर सप्लाई':'power supply 24v dc','रिले':'relay safety contactor switch',
    'एनकोडर':'encoder rotary position speed','बरैट्रॉन':'baratron mks capacitance gauge',
    'पिरानी':'pirani mks 925 vacuum gauge','थायरिस्टर':'thyristor thyro-a power controller scr',
    'स्टेपर':'stepper stogra motor drive wire feeder','स्प्रेडर':'spreader kickert bowed roller',
    'शाफ़्ट':'shaft svecom mechanical expanding reel','ईटीपी':'etp express clamping hub',
    'कपलिंग':'coupling flexible jaw oldham bellows','प्रोफ़ीबस':'profibus dp communication fieldbus node'
  };
  // Expand query with Hindi translations
  Object.keys(hiMap).forEach(function(hi){
    if(q.indexOf(hi)>=0) q+=' '+hiMap[hi];
  });
  var words=q.split(/\s+/).filter(function(w){return w.length>2;});
  
  // Search BOTH indexes: MetPro (BOBST manual) and MetExp (equipment manuals)
  var allScores=[];
  
  // MetPro (BOBST K5 OEM manual chapters)
  PDF_INDEX.forEach(function(p,idx){
    var score=0;
    words.forEach(function(w){
      if(p.k.indexOf(w)>=0) score+=1;
      if(w.length>4 && p.k.indexOf(w)>=0) score+=1;
    });
    if(score>1) allScores.push({idx:idx,f:p.f,score:score,src:'metpro'});
  });
  
  // MetExp (equipment manuals)
  PDF_INDEX_EXP.forEach(function(p,idx){
    var score=0;
    words.forEach(function(w){
      if(p.k.indexOf(w)>=0) score+=1;
      if(w.length>4 && p.k.indexOf(w)>=0) score+=1;
    });
    if(score>1) allScores.push({idx:idx,f:p.f,score:score,src:'metexp'});
  });
  
  allScores.sort(function(a,b){return b.score-a.score;});
  // Return top 3 matches (was 2, now 3 since we have more sources)
  return allScores.slice(0,3);
}

// Extract text from PDF using pdf.js
function extractPDFText(url,maxPages){
  maxPages=maxPages||15;
  return new Promise(function(resolve,reject){
    if(_pdfCache[url]){resolve(_pdfCache[url]);return;}
    if(!window.pdfjsLib){reject(new Error('pdf.js not loaded'));return;}
    pdfjsLib.getDocument(url).promise.then(function(pdf){
      var totalPages=Math.min(pdf.numPages,maxPages);
      var textParts=[];
      var processed=0;
      for(var i=1;i<=totalPages;i++){
        (function(pageNum){
          pdf.getPage(pageNum).then(function(page){
            page.getTextContent().then(function(tc){
              var t=tc.items.map(function(item){return item.str;}).join(' ');
              textParts[pageNum-1]=t;
              processed++;
              if(processed===totalPages){
                var fullText=textParts.join('\n\n');
                // Limit to ~4000 chars to stay within token budget
                if(fullText.length>4000) fullText=fullText.substring(0,4000)+'... [truncated]';
                _pdfCache[url]=fullText;
                resolve(fullText);
              }
            });
          });
        })(i);
      }
    }).catch(function(err){
      console.warn('PDF fetch error:',url,err);
      resolve('');
    });
  });
}

// Fetch relevant PDF context for a query
function fetchPDFContext(query){
  var matches=findRelevantPDFs(query);
  if(matches.length===0) return Promise.resolve('');
  
  var promises=matches.map(function(m){
    // Use correct base URL depending on source
    var base=(m.src==='metexp')?PDF_BASE_EXP:PDF_BASE;
    var url=base+encodeURIComponent(m.f);
    return extractPDFText(url,10).then(function(text){
      return text?('\n--- FROM: '+m.f+' ---\n'+text):'';
    }).catch(function(){return '';});
  });
  
  return Promise.all(promises).then(function(texts){
    var combined=texts.filter(function(t){return t.length>50;}).join('\n');
    return combined;
  });
}

var AI_SYS_PROMPT=`You are "MetTrain AI Expert" — a highly knowledgeable BOBST K5 Expert vacuum metallizer technical assistant for industrial vacuum metalliser plants. You answer in Hindi (Hinglish) with English technical terms. You are friendly, practical, and factory-floor oriented.

MACHINE IDENTITY:
- Metalliser-1: BOBST K5 Expert 3300MM 
- Metalliser-2: BOBST K5 Expert 3650MM 
- Process: PVD (Physical Vapour Deposition) of Aluminium on flexible substrates (PET, BOPP, CPP, Nylon)
- Evaporators: Ceramic boats heated to 1450-1500°C at ~750A/10V
- Vacuum: Evaporation zone <8e-4 mbar, Winding zone ~2e-2 mbar

VACUUM SYSTEM:
- Pump chain: Busch Cobra NC 630 Dry Screw → Aerzen GM2000/GL8000 Mechanical Booster/Roots (10 to 1e-3 mbar) → Varian NHS-20 Diffusion Pumps (CVC Silicone 4 oil, normal temp 220°C, capacity 4.7L) → Brookes Cryogenic coils (-120°C via Polycold)
- Modes: Startup, Vacuum, Standby/Hold, Vent, Shutdown, Eco Vacuum
- HMI colors: Grey=Off/Closed, White=Running/Open, Alternating=Transitioning, Red=Fault
- Diffusion pump must reach 220°C before high vacuum sequence
- Cryogenic: White=Standby, Light Blue=Cool, Yellow=Defrost
- Vent: VV10A (winding zone) opens first, then VV10B (evaporation) at ~400 mbar. AlBond uses slower VV10C valve.
- Leak causes: Air leak, internal water leak, unclean machine (AlOx), outgassing substrate, pump failure
- Pressure rise test: <30 microns acceptable; helium leak detection for fine leaks
- Pumpdown sequence: RP1 starts → BP engages at ~10 mbar → DP pre-heated → VV7 opens for high vacuum → Cryo coils engage
- Water supply: Feed pressure >3 bar, differential >2.5 bar. If low for >5 min, pumps shut down. Temp limits: warning at 22-28°C, alarm at 30°C, shutdown after 10 min at 30°C.

EVAPORATION PROCESS:
- Boats installed with graphite tape at both ends for electrical contact
- New boat warmup: 12 min ramp to ~500°C then faster (NEW BOAT setting)
- Old boat warmup: 4 min ramp (OLD BOAT setting — default after first use)
- Wire feeders: stepper motor driven, base speed typically 20 cm/min
- Shutter: minimum open speed 120 m/min; opens automatically at set % of line speed
- Shutter must be CLOSED for winding cart to enter chamber
- Viewing flap: 4-minute auto-close timer; strobe tube rotates to prevent window coating
- Release agent: Boron Nitride or graphite suspension on source box/shields
- OD Control modes: Stop, Warm-up/Standby (100% base wire speed), Manual (individual channel), Auto (PLC adjusts wire feed to maintain uniform OD within 60% band, drops to standby if outside 30% band)
- Optimum Set-Point: remembers last run's wire feed values for faster startup next cycle
- Inline monitor: Hawkeye system with 5 optical probes — measures OD, Resistivity (Ohms/sq), Light Transmission (%T)
- OD Curve: recipe-based conversion between online OD and offline lab densitometer readings (X-Rite 301 etc.)
- Deposit alarms: configurable high/low warning and alarm levels as % of target
- Pinhole detection: 4 size ranges, configurable warning level (holes/m²)
- Copper contact blocks: neutral side is water-cooled, live side is non-cooled. Can rotate 180° for second use. Use Rocol J166 anti-seize on bolts.
- Source height adjustable via jacking bolts — closer to drum = better collection efficiency but more heat. Must level with spirit level.
- Sine waves on coating shield: none below 60 cm/min wire speed, lower only at 60-90 cm/min, both upper+lower above 90 cm/min. Use graphite tape between sine wave and shield.

WINDING SYSTEM:
- Web path: Unwind(1) → Unwind Layon(2) → Spreader(3) → Load Cell(4) → Cork Draw CVD1(5) → Bowed Roller(6) → Water Cooled Drum WCD(7) → Water Cooled Roller DTR1/WCR(8) → Cork Draw DTR2(9) → Bow Spreader(10) → Load Cell(11) → Bow Spreader(12) → Rewind Layon(13) → Rewind(14)
- Core: 6" (152mm OD, 154mm ID minimum). Spirally wound cardboard, wall thickness 14-17mm recommended.
- Reel shaft: 152mm mechanical expanding shaft. Tighten with T-wrench ~100 Nm. Must centralize roll on shaft.
- Chucking: female spline engages over male spline → swing over clamp → toggle clip locks. Sensors monitor full engagement.
- Layarm modes: GAP (15-20mm normal, max 50mm) or CONTACT (50-100N normal, max 400N). Back = disabled.
- On web break: layarm drives into roll at max torque to minimize substrate loss.
- Drum cleaner: footswitch = 20 m/min normal direction. Optional high-speed device = 280 m/min with vacuum attachment.
- Sidelay: moves unwind/rewind rolls ±15mm. Oscillation ±1-10mm with 10s dwell.
- Web threader: motorised T-belt system
- Direction: underwind or overwind selectable for both unwind and rewind
- Tension guidance: PET 12μm = 31-40 N/1000mm, BOPP 20μm = 36-44 N/1000mm, Nylon 12μm = 31-40 N/1000mm, CPP 25μm = 3.2-8 N/1000mm
- Taper/Profile tension: adjustable curves for rewind tension vs diameter. Important for paper (decrease tension as diameter grows) and large PET rolls (may need increase).
- Drive modes: Draw (closed loop, % speed reference to CVD1) and Torque (open loop, N force). Drum/DTR1/DTR2 normally run slightly faster than draw roller to keep film tight on drum.
- Gain settings: higher values for soft films (CPP, LDPE), lower for stiff films (BOPP, PET, Paper)
- Web break detection: triggers when tension drops below 3% of full range. Fast stop in 10-20 sec. Auto closes shutter, stops wire feed and boats.
- Auto slowdown: calculates when to decelerate based on unwind final diameter setting.
- Gas wedge system: supplies controlled air between drum and substrate for improved cooling. Centre and edge flow independently adjustable (slm). Nozzles can block — clean with 1mm drill.

OPERATIONAL SEQUENCES:
- Standard Al metallizing: Load rolls → thread → set recipe → pump down → heat boats (NEW/OLD warmup) → wire on → shutter open → run in auto OD control → shutter close → wire off → boats off → vent → unload
- AlBond/AlOx process: Additional O2/Ar gas flow via MFCs, pre-gas target 0.3 OD higher, slower VV10C venting, shield temperature monitoring (stops vent if >250°C), AlOx waste stored in sealed steel drums with 6mm vent hole, max 1/3 full
- E-Stop: removes ALL power to drives, rotating equipment, evaporation. Reset via E05 panel flashing button.
- G-Stop: removes power to drives, traverse, shutter pneumatics. Triggered by traverse isolator OFF. Reset via E05 panel.
- Shutdown: Press Shutdown on Vacuum HMI → 30-50 min sequence. Partial pump to 500 mbar before full shutdown.
- Inch function: 5-sec warning delay, then hold button 3 sec, release 1 sec, press again. Drum inches at slow speed.

PLASMA TREATER:
- AC magnetron source for substrate pre-treatment (improved adhesion, barrier)
- Process gas: Argon, Nitrogen, Oxygen, or mixed (e.g. 80% Ar / 20% O2). Pressure: 4e-2 to 8e-2 mbar in treater enclosure.
- Control modes: Pressure mode (preferred, auto-adjusts gas flow) or Flow mode (fixed gas rate)
- Power supply: water-cooled, located in E0_7 panel. Ramp or Fixed power modes.
- Anti-backside shields: set 15mm behind substrate edges to prevent treating wrong side
- Focusing/impedance shields: aluminum angle 2x2x1/4" (BS1474 H30/6082), cut to width
- Burn-in procedure: Remove substrate → evacuate to <3e-2 mbar → start at 2kW → increment 0.5-1kW steps → wait several minutes between increments
- Cleaning: Basic (IPA/acetone + lint-free cloth + fine abrasive paper) or Deep (orbital sander with min 250-grade, ideally 1000-grade)
- High O2 safety: Air dilution system on Cobra pump, max 23% O2 in exhaust. PTFE tape NEVER on O2 lines — use Cobas Green Oxygen tape only.
- Arcing: tracked as voltage/current arcs per minute on diagnostic screen. Clean electrodes if excessive.

CLEANING:
- PPE: Safety goggles (ANSI Z87.1), gloves, respirator (EN 149:2001), flame-retardant overalls (ISO 14116:2008), safety boots
- Tools: Flat scrapers, beryllium copper blade scrapers for AlOx (spark-proof). NEVER steel tools on chrome rollers.
- Industrial vacuum cleaner: combustible dust rated (e.g. Nilfisk CFM). Empty after each cycle.
- AlOx waste: sealed steel drums, clearly labeled, 6mm vent hole, max 1/3 full, store outside away from ignition sources. Do NOT mix Al and AlOx waste.
- Between runs: clean source area, check wire feed, check wire levels, clean evaporators, check O-ring
- Shift end: + inspect coating shields, apply release agent, check rubber rollers
- Weekly: clean source box to bare metal, clean copper posts/blocks, clean all shielding, clean zone separation, clean all rollers, clean viewing windows, clean plasma electrodes
- Cryogenic coils: wipe clean with lint-free cloth, no abrasives (thin wall risk)
- Viewing window: razor blade scraper or weak caustic solution on toughened glass. Never solvents/acids on chamber windows (chemical attack risk).

PM SCHEDULE HIGHLIGHTS:
Wire Feeders: Weekly check clamp/guide tube. Monthly turn drive wheel to 2nd groove or clean with caustic soda, check springs, clean spouts. Quarterly clean rotating arms. Bi-annual replace bearings/springs/drive wheels.
Inline Monitor: Weekly check cables/lenses. Monthly calibrate. Quarterly check bolts. Annual replace filter.
Evaporation Source: Weekly visual inspect after cleaning. Monthly check insulators, copper block bolts, stepper cabling, spring-loaded contacts.
Coating Shield/Shutter: Quarterly clean cylinder housing/guide rails/gearbox breather. Annual replace gearbox oil, inspect lifting cables. 3 Years replace lifting cables.
Gas Wedge: Daily check valve operation. Monthly check MFC solenoids/cables. Bi-annual clean inlet filters with acetone, check for blockages.
Motors: Monthly clean fans. Quarterly check encoders. Bi-annual check electrical connections. Annual check bearings.
Spreader (Kickert): Weekly check rubber sleeve, apex position, motor operation. 5 years send for overhaul.
Leadthroughs: Daily check gravity oil bottles. Weekly check internal shaft for leaks. Bi-annual check bearing play.
Chiller: Coolant specific gravity 1.080 at 20°C (ethylene glycol/water) for -30°C freezing point. Test with hydrometer.
Lubrication greases: Type A (general bearings), Type C (O-rings/seals/vacuum), Type F (electrical connections), Type I (Deublin rotary unions). Oils: Anderol 555 (Busch/Aerzen pumps), CVC Silicone 4 (diffusion pumps), BML HYD10 (non-cooled leadthroughs), Castrol Hyspin AWS 10 (cooled drum/DTR1 leadthroughs).

ALARM CODES (Section 9.2):
312-316: Low Water Flow BP2-BP6 → check water supply, seek technical assistance
322: Auto source shut off (inactivity timeout) → restart boats
323-325: Spreader motor timeouts → seek technical assistance
331: Web threader circuit breaker tripped (E06_0 Panel) → reset breaker
332: Crane E-Stop activated → reset crane E-Stop
333: 110/240V supply breaker tripped (E06_0 Panel) → reset breaker
335: Blower circuit breaker tripped (E06 Panel) → reset breaker
339: Rewind chucks not fully closed → check proxy switches, re-engage chucks
340: Unwind chucks not fully closed → check proxy switches, re-engage chucks
341-344: Varibow spreader faults → check contactor/PSU/breaker/drive
347: Cryogenic fault CG4 → check Polycold system
348: Main water pressure low → check supply (needs >3 bar feed, >2.5 bar differential)
349: Main water pressure high → check regulator
350-351: Mech water pressure low/high → check mechanical booster water
353-464: Profibus node failures (nodes 1-112) → check network connections, power to specific node

HMI ACCESS:
- Default logins: Operator 1/Operator 1, Operator 2/Operator 2, Operator 3/Operator 3
- Screens: MONITORING (live process), RECIPES (setup), CONFIGURATION (runtime changes), DIAGNOSTICS (troubleshooting), REPORTS (roll data), DRIVES (winding)
- USB keyboard/mouse can connect to port on E0_5 panel

RECIPES SYSTEM:
- Favorites (max 9) and All Recipes lists
- Parameters: Web type/density/thickness/width, Source process type, Wire speed, Shutter open/close % of line speed, Drum temp, Gas wedge flows, Winding tensions/directions/gains, Deposit targets/alarms, Plasma settings
- SAVE LIVE: saves current running parameters to recipe
- LOAD TO MACHINE: downloads recipe to PLC
- BOBST-created recipes cannot be deleted

REPORTING:
- Deposit Table: sampled every 30 sec with time and length position
- Deposit Variation: color-coded in-spec/out-of-spec map
- Run Summary: process settings and material processed
- Out of Specification: records position (width + length) of any out-of-spec readings
- Efficiency Report: last 28 cycles, green=total met cycle, light blue=% within spec
- Cycle Times: color-coded breakdown of production cycle phases
- Source Report: evaporator life and wire consumption tracking
- Archive: 6 months of searchable reports by date/shift/operator/roll ID

VACUUM EVAPORATION THEORY (from AIMCAL reference):
- PVD: atoms travel ballistically (Kn>1) from heated source to cooler substrate
- Al vapor pressure: needs ~980°C for 1e-4 Torr, ~1220°C for 1e-2 Torr
- Film thickness depends on: evaporation rate, source-to-substrate geometry (distance, angle), time
- Optical Density (OD): measures metal thickness via light transmission. Higher OD = thicker metal.
- Surface Resistance (Ohms/sq): inversely related to metal thickness
- Barrier properties: OD correlates with O2 and WVTR barrier. Higher OD = better barrier.
- Metal adhesion tests: TP-104-87 (Scotch 610 tape go/no-go) and TP-105-92 (DAF 899 EAA peel test at 220°F/15sec/15psi)
- Wire oxidation causes spitting and pinholes in coating
- Substrate surface treatment (corona, plasma) improves adhesion by increasing surface energy

TOPMET 2450 (Applied Materials) reference knowledge:
- Similar industrial metallizer, uses SIMATIC S7-400 PLC
- Drum-based winding system with pretreatment station
- Polycold cryogenic cooling, oil diffusion pumps
- Safety chain with hardware/software interlocks

AUXILIARY EQUIPMENT (from MetExp OEM manuals — 250+ equipment PDFs):

BUSCH COBRA NC 630 (Dry Screw Vacuum Pump):
- Model: NC 0630 C with direct cooling water system
- Manufacturer: Ateliers Busch S.A., Switzerland
- Type: Oil-free dry screw, contact-free compression
- Cooling: Direct cooling water system (also available with plate heat exchanger variant NC 630 B)
- Maintenance: Filter element, seal inspection, no oil changes needed (dry pump)
- Safety: Never run dry without cooling water. Check inlet filter regularly.

AERZEN ROOTS BLOWER (Mechanical Booster):
- Models: GM2000 / GL8000 series
- Controller: COMBIVERT F5-Compact frequency inverter for speed control
- Function: Bridges gap between rough pump (Cobra) and high vacuum (diffusion pump)
- Monitoring: Speed, current, temperature via inverter diagnostics
- Connection: Controlled by PLC via analog/digital signals

AE THYRO-A (Thyristor Power Controller — evaporation boat heater):
- Manufacturer: Advanced Energy
- Function: Controls AC power to ceramic evaporation boats (resistance heating)
- Operating modes: TAKT (full wave switching), VAR (phase angle), QTM (half wave)
- Control: 0-10V or 4-20mA setpoint input, PID capability
- Monitoring: LED error codes, fault relay K1, mains voltage/load/temperature monitoring
- DIP switches S1: configure operating mode, load type, control source
- Bus module option: Ethernet IP, Profibus for remote monitoring
- Safety: Over-temperature shutdown, thyristor short circuit detection, mains failure detection

MKS BARATRON 627B (Capacitance Manometer):
- Type: Absolute pressure transducer (not gas-composition dependent)
- Ranges: 0.1, 1, 10, 100, 1000 Torr full scale
- Output: 0-10V DC proportional to pressure
- Accuracy: 0.12% of reading
- Use: High-accuracy pressure measurement in evaporation/winding zones
- Calibration: Zero and span adjustable. Factory cal traceable to NIST.
- Connection: 15-pin D-sub connector

MKS 925 MICROPIRANI (Vacuum Gauge):
- Type: Micro-Pirani thermal conductivity + piezo hybrid sensor
- Range: 1×10⁻⁴ to 1000 Torr (atmosphere to high vacuum in one gauge)
- Output: Analog 0-10V, RS485/RS232 digital
- Relay setpoints: 2 configurable relay outputs for pump interlock/alarm
- Use: Replaces traditional Pirani gauge for pumpdown monitoring, crossover switching
- Gas correction: Calibrated for N2/Air, correction factors needed for Ar, O2

EDWARDS AIM (Active Inverted Magnetron Gauge):
- Models: AIM-S, AIM-SL, AIM-X, AIM-XL (NW25 connection)
- Type: Cold cathode / Penning-type gauge for high vacuum
- Range: 1×10⁻⁹ to 1×10⁻² mbar
- Use: Measuring high vacuum in evaporation chamber
- Degas function: Built-in for accurate low-pressure readings
- CE compliant: EN61010-1, EN61326-1

MKS 1179A/2179A MASS FLOW CONTROLLER (MFC):
- Function: Precisely controls gas flow (Argon, Oxygen, Nitrogen) for plasma treater and AlBond process
- Ranges: Various (sccm/slm), gas-specific calibration
- Control: 0-5V analog command signal, 0-5V output proportional to flow
- Calibration: Zero and span adjustable at controller
- Safety: Normally-closed valve — gas stops on power failure

STÖGRA SERS 02/06/12 (Stepper Motor Drive — Wire Feeders):
- Manufacturer: Stögra Antriebstechnik GmbH, München
- Models: SERS 02 (2A), SERS 06 (6A), SERS 12 (12A)
- Function: Position-controlled stepper motor amplifier for wire feeder motors
- Interface: RS232C / RS485 for programming and control
- Features: DIP switch configuration (drive number, baud rate, auto-start, service switch)
- Limit/home/stop switches: configurable for wire end detection
- Motor compatibility: Stögra SM 87/107/168 series 2-phase stepper motors
- Wiring: Bipolar (parallel or serial), unipolar options. Color code: brown/white/black/red/blue/grey/yellow/green
- Brake option: Available on SM models with suffix B or BE50

KICKERT BOWED ROLLER (Spreader):
- Function: Eliminates creasing, slack edges, and slack centres in web
- Installation: Entry distance A = 2× exit distance E. E ≈ 2.5× roller diameter.
- Web passes over CONCAVE side of bowed roller
- Wrapping angles (film industry): PP/PA 1-6μm: 60-90°, 8-20μm: 45-60°, >20μm: 45°, metallised: 15-20°
- Adjustment: Equal entry/exit angles for basic anti-crease. Decrease wrap for slack edges, increase for slack centres.
- Maintenance: Check rubber sleeve weekly, motor operation, send for 5-year overhaul

BOBST CHILLER/HEATER SYSTEM:
- Manufacturer: Green Resource Engineering Ltd (GRE), Devon, UK
- Capacities: 24kW, 40kW, 80kW heater-chiller units
- Coolant: Ethylene glycol/water mixture. Specific gravity 1.080 at 20°C for -30°C protection.
- Refrigerant: R407C or R410A
- Function: Maintains process drum, DTR, and water-cooled roller temperatures
- Alarms: Low/high pressure, low flow, high temperature, compressor fault
- Maintenance: Check coolant level/SG, clean condenser coils, check refrigerant pressures, inspect compressor

ETP EXPRESS (Hydraulic Clamping Hub):
- Function: Keyless shaft-hub connection for precise, high-torque clamping
- Material: Double-walled hardened steel sleeve (Type R: stainless steel 1.4057)
- Mounting: Tighten pressure setting screw with specified torque (Molykote G-n plus lubricant)
- WARNING: NEVER open radial bore in flange — factory pressure medium fill only
- Used on: Reel shafts, drive connections, roller mountings

SVECOM MECHANICAL EXPANDING SHAFT:
- Size: 152mm (6 inch) for core engagement
- Operation: Keys engage into core — numbered sequence (1, 2, 3...) from drive side
- Dismantle: Remove security dowels → heat outer surface to ~200°C → extract drive neck and central pin
- Components: Cup, retaining ring, torsion spring, key, block, load-bearing pipe, base neck

FLEXIBLE COUPLINGS (various manufacturers):
- Types: Jaw/spider (KTR Radex-N, polyurethane element), Oldham (lateral offset), Beam/bellows (zero backlash), Elastomeric
- KTR Radex-N: Polyurethane spider, vibration damping, maintenance-free
- Selection: Based on torque, speed, misalignment (angular, lateral, axial), bore size
- Source/Strobe coupling: Used on evaporator strobe tube drive — follow specific alignment procedure

VFD DRIVES ON BOBST K5 EXPERT:
- Schneider Altivar ATV71: Main winding drives (unwind, rewind, draw rollers). Profibus DP communication. Trip codes in Fxx format. Programming via keypad or SoMove software.
- Siemens SINAMICS G120C: Auxiliary drives. BOP keypad parameter access. Profibus/Profinet communication. Safety Integrated (STO/SS1).
- Control Techniques Unidrive SP: Alternative/supplementary drives. CTNet and Profibus options. SM-modules for IO, encoder, communication. Auto-tune for motor commissioning.
- CT 890 Series: DC drive option for older motor configurations.
- XL50: Basic DC motor drive for small auxiliary motors.

B&R AUTOMATION (PLC System):
- X20 System: Modular PLC with CPU (X20CPx48x), bus controller, IO modules
- Interface: X20IF1063 Profibus DP master for drive communication
- Storage: CompactFlash cards for program and data
- Software: Automation Studio for programming
- X67 Remote IO: For distributed installations via Powerlink

SIEMENS PLC & IO:
- ET200M: Modular distributed IO on Profibus DP (rack-based)
- ET200S: Compact distributed IO on Profibus (smaller modules)
- IPC227D: Industrial embedded PC for HMI/SCADA functions
- STEP 7 / TIA Portal: Programming environment for S7 PLCs
- Profinet: Ethernet-based industrial networking (newer installations)
- Safety components: 3TK28xx safety relays for E-stop, guard monitoring, two-hand control

IFM SENSORS & AS-INTERFACE:
- AS-Interface (ASi): 2-wire bus system connecting sensors/actuators. Yellow flat cable.
- AC5000/AC5020: ASi master modules (direct or via Profibus gateway)
- AC1218/AC1258: ASi power supplies (24V DC, 8A)
- PT100/TN2531: Temperature sensors for process monitoring
- SM6004: Magnetic-inductive flow sensor for cooling water monitoring
- LMT: Level sensor for coolant tanks
- Proximity switches: Inductive sensors for position detection (chuck engagement, shutter position, etc.)

FESTO PNEUMATICS:
- Standard cylinders (DSBC): Shutter, coating shield, pneumatic actuators
- Pressure regulators & FRL units: Compressed air treatment
- ASi valve terminals: Bus-connected solenoid valve islands
- Flow control valves: Cylinder speed regulation (meter-in/meter-out)
- Service unit combinations: Filter-regulator-lubricator assemblies

SKF BEARINGS:
- Deep groove ball bearings (6200/6300 series): Standard roller bearings
- CARB toroidal: Self-aligning for misalignment compensation
- Spherical roller: Heavy load, vibration environments
- Cam followers: Guide roller track applications
- Maintenance tools: Bearing heaters, pullers, grease guns, laser alignment tools

PROFIBUS NETWORK (critical for drive communication):
- Protocol: DP (Decentralized Periphery) for fast IO and drive control
- Cable: Purple sheathed, max 12 Mbit/s, 32 nodes per segment
- Termination: Active terminator required at both ends of each segment
- Connector: DB9 sub-D (Fast-Connect type available)
- Troubleshooting: Check termination, cable integrity, node addresses. Use oscilloscope for telegram analysis.
- Common alarm codes 353-464 relate to Profibus node failures — check specific node power and connections.

SAFETY EQUIPMENT:
- Emergency stop: Pilz/Siemens safety relays (3TK2822-2828) for dual-channel E-stop monitoring
- Door interlocks: Siemens 3SE6604/3SE6704 magnetic switches for chamber doors
- Guard monitoring: Safety relay with feedback loop
- Polycarbonate viewing windows: Hygard BR 750 bullet-resistant laminate for vacuum chamber viewing
- Alarms: Klaxon visual beacons + Roshni audible sounders

RULES:
1. Answer in Hindi (Hinglish) with English technical terms retained as-is
2. Be practical and factory-floor oriented — operators need actionable answers
3. For safety questions, always emphasize PPE and proper procedures
4. Reference specific HMI screens, alarm codes, and procedures when relevant
5. If unsure, say so honestly — never fabricate technical data
6. Keep answers concise but thorough — operators are busy
7. For troubleshooting, give step-by-step actions
8. Always mention safety warnings where relevant

═══ COMPLETE DRIVE FAULT CODE TABLES ═══

ATV71 FAULT CODES:
OCF=Overcurrent(check motor cables,reduce load), OSF=DC bus overvoltage(increase decel time,add brake resistor), OHF=Drive overheat(clean fan,check ambient), OLF=Motor overload(reduce load,check ItH), SCF1=Short circuit motor phase(check U-V-W cables), SCF3=Ground fault(check motor insulation), SOF=Overspeed(check reference/encoder), CnF=Comms fault(check Modbus/fieldbus cable), PHF=Input phase loss(check 3-phase supply), USF=Undervoltage(check supply voltage), BRF=Brake resistor fault(check connection), EPF1=EEPROM fault(power cycle;if repeat=replace), InF2-4=Internal fault(power cycle;if repeat=replace), tnF=Autotune fault(check motor data), CFI=Bad configuration(check params), LFF3=AI loss 4-20mA(check cable). Reset: STOP/RESET key or via LI terminal.

SINAMICS G120C FAULT CODES:
F00001=Overcurrent(check cables/load), F00002=DC link overvoltage(check decel/brake), F00003=DC link undervoltage(check supply/fuses), F00004=Heatsink overtemp(clean fan/heatsink), F00005=I2t overload(reduce load), F07320=Auto restart failed(check motor), F07331=Motor stall(check mechanical blockage), F07801=Motor ID fail(recheck motor data), F07900=Motor blocked(remove block), F30001=Power unit overcurrent, F30002=DC overvoltage, F30003=DC undervoltage, F30004=Heatsink overtemp, F30011=Motor overtemp sensor(check PTC/KTY). Motor won't start checklist: 1)Fault present? 2)p0010=0? 3)r0052.0=1? 4)Enable r0046? 5)Command source p0015? 6)Motor data match?

UNIDRIVE SP TRIP CODES:
1=UV(DC bus undervoltage: 400V drive UV@330Vdc reset@425Vdc), 2=OV(overvoltage), 3=OI.AC(overcurrent in accel >222%), 4=OI.br(overcurrent braking), 5=PS(power stage), 6=Et(external trip), 7=O.SPd(overspeed), 8=PS.10V(10V supply overload), 9=PS.24V(24V supply overload), 10=br.th(brake resistor thermal), 11-14=tunE1-4(autotune fail), 20=OL1(motor I2t overload), 21=OL2(drive overload), 23=OHt(drive overtemp), 27=O.ht3(thermal model), 30=SCL(short circuit), 101=OI.dc.P, 103=Oht1.P, 105=Oht2.P(heatsink), 108=SC.P(power module short), 182-188=C.Err to C.cPr(SM module comms errors), 189-194=EnC1-6(encoder errors). Auto-reset: Pr10.34=attempts, Pr10.35=delay. Security reset: Pr0.00=1299.

ATV312 FAULT CODES:
OCF=Overcurrent, OSF=Overvoltage, OHF=Overheat, OLF=Motor overload, SCF=Short circuit, SOF=Overspeed, CnF=Comms fault, PHF=Phase loss, USF=Undervoltage, InF=Internal, OPF1=DI config error, OPF2=AI config error, LFF=AI1 loss(<2mA), EEF=EEPROM. Factory reset: FCS=InI.

THYRO-A LED PATTERNS:
GREEN on+RED off=Normal. PULSE flash slow=Frequency/SYNC error(check mains). LOAD flash slow=Device overtemp 90/95°C(cool down). LOAD on=Undercurrent(check load circuit). LOAD flash+PULSE on=Overcurrent/Short(check load). PULSE on=Pulse blocking(check X2.1-X2.2 bridge). DIP switches: S1-S6 for voltage range, firing mode, load monitoring. Models: 1A to 280A range. Bus module: Profibus/Modbus/Analog interface.

BOBST GRE CHILLER ALARMS:
HIGH_LEVEL_FLT=High glycol level(header tank), PRIM_FLOW_FLT=Tower water flow(valves/Y-strainer), PROC_FLOW_FLT=Glycol flow(pump/level/strainer), PT1_FLT=High gas pressure Ckt1, PT2_FLT=Low gas pressure Ckt1, PT3_FLT=High gas pressure Ckt2, PT4_FLT=Low gas pressure Ckt2, PT5_FLT=Glycol pressure, TT1_FLT=Glycol temp, WATCHDOG_FLT=Profibus loss(PLC/cable), COMP_OVL=Compressor overload(reset/motor), PUMP_OVL=Pump overload, HIGH_PRESS=High refrigerant(condenser/fan/tower water), LOW_PRESS=Low refrigerant(charge/expansion valve). Glycol: 50% ethylene glycol, SG 1.080@20°C, freezing -30°C. Superheat controller: Carel IR33 target 6°C±1°C.

═══ COMPLETE PROCESS PARAMETERS ═══

TENSION SETTINGS (N/1000mm width):
PET 12µ: Unwind 31-40, Rewind 31-40, Gain Low
BOPP 20µ: Unwind 36-44, Rewind 36-44, Gain Low
Nylon 12µ: Unwind 31-40, Rewind 31-40, Gain Medium
CPP 25µ: Unwind 3.2-8, Rewind 3.2-8, Gain HIGH (very soft film!)
Paper: Higher tension, decrease with diameter
Taper: 30-50% reduction core to surface. No taper=starring defect.

VACUUM TARGETS:
Evaporation zone: <8×10⁻⁴ mbar (production)
Winding zone: ~2×10⁻² mbar
Base vacuum: ~5×10⁻⁵ mbar
Pumpdown time: 25-45 min normal
Pressure rise test pass: <1×10⁻³ mbar/min (<30 microns)
Crossover to DP: 1×10⁻¹ to 5×10⁻² mbar

EVAPORATION PARAMETERS:
Boat current: 600-800A (never >900A)
Boat voltage: 8-12V per boat
Boat temperature: ~1450-1500°C
Wire diameter: 1.5mm or 2.0mm (99.99% pure Al)
Wire feed base speed: ~20 cm/min
New boat warmup: 12 min slow ramp
Used boat warmup: 4 min ramp
Boat life: 8-24 hours typical
Shutter min open speed: 120 m/min

OD TARGETS BY PRODUCT:
Chips/Namkeen: OD 2.2-2.5
Biscuit wrapper: OD 2.0-2.3
Coffee/Tea: OD 2.5-2.8
Milk powder: OD 2.5-3.0
Pharma blister: OD 2.8-3.2
Decorative: OD 1.8-2.2
AlBond: OD 2.0-2.5
Capacitor: OD 2.5-3.5
Uniformity: Width ±0.1 OD, Length ±0.15 OD

COATING THICKNESS vs OD:
OD 2.0≈30nm, OD 2.3≈40nm, OD 2.5≈50nm, OD 3.0≈80nm, OD 3.5≈120nm

LINE SPEED:
PET 12µ OD2.3: 750-820 m/min
BOPP 20µ OD2.5: 600-750 m/min
CPP 25µ OD2.0: 300-500 m/min (SLOW!)
AlBond: 400-600 m/min
Maximum design: ~850 m/min

CHILL DRUM TEMPERATURE:
PET: -5°C to +10°C
BOPP: -10°C to +5°C
CPP: 0°C to +15°C
Nylon: -5°C to +5°C
Colder=better adhesion but condensation risk on vent

SUBSTRATE SURFACE ENERGY (dyne/cm):
Untreated BOPP: ~28-32 (FAIL!)
Treated BOPP: ≥38 (PASS)
PET minimum: ≥40
CPP minimum: ≥38
Nylon minimum: ≥42

BARRIER PROPERTIES (metallized vs unmetallized):
PET 12µ WVTR: 0.5 vs 15 g/m²/day (97% reduction!)
PET 12µ OTR: 1.0 vs 100 cc/m²/day (99% reduction!)
AlBond WVTR: 0.05 g/m²/day (99.7% reduction!)
AlBond OTR: 0.1 cc/m²/day (99.9% reduction!)

═══ TROUBLESHOOTING DECISION TREES ═══

MACHINE WON'T START: Check: 1)Main supply/isolator ON? 2)ALL E-stops released? 3)All door interlocks closed? 4)Safety relay reset+green LED? 5)PLC running (RUN LED)? 6)HMI alarm? 7)Air pressure OK (6bar)? 8)Drives ready? Most common: E-stop not fully released, door interlock, safety relay needs reset.

VACUUM NOT REACHING: Check: 1)O-rings(#1 cause!) 2)Door seal 3)Pump performance(Cobra current normal?) 4)Aerzen running? 5)DP at 220°C? 6)Cryo at -120°C? 7)Outgassing(long air exposure) 8)Gauges correct? Quick diagnosis: Rough bad(>1mbar)=Cobra/big leak. Medium bad(>10⁻²)=Aerzen/medium leak. High bad(>10⁻⁴)=DP/cryo/small leak.

CHILLER NOT COOLING: Check: 1)Compressors running? 2)Glycol pump running? 3)Glycol level OK? 4)Glycol concentration 50%? 5)Tower water flow? 6)Condenser clean? 7)Expansion valve superheat 6°C±1°C? 8)Refrigerant charge(sight glass)? 9)SCADA alarms? 10)Reheat valve closed?

OD PROBLEMS: Low OD=Wire feed slow/Boat failing/Wire oxidized/Speed too high. High OD=Wire feed fast/Speed too low. Unstable OD=Wire feed inconsistent(feeder springs/spout/groove)/Boat temperature fluctuating/Multiple boats at different states/Hawkeye dirty. Uneven across width=Shield misaligned/One boat failing/Wire feed uneven/Copper contacts uneven.

WEB BREAK CAUSES: Excessive tension/Edge damage on roll/Foreign particle on roller/Wrinkle in nip/Sudden speed change/Splice failure/Overheated film. Recovery: Stop→Remove broken film→Clean rollers→Re-thread→Slow restart→Log event.

WRINKLES: Spreader misaligned(Kickert horizontal+vertical)/Wrong wrap angle(met film:15-20°)/Roller misaligned/Tension imbalance(L/R unequal)/Dirty roller/Nip pressure uneven/Film defect.

PINHOLES: Boat splash(end-of-life/wire feed fast)/Dust on film(dirty rollers/substrate)/Excessive deposition rate/Arcing(shield grounding/contamination). Detection: Backlight visual or pinhole detector.

BOAT OVERHEATING/CRACKING: Dirty copper contacts→Clean with sandpaper+graphite tape. Loose clamp bolts→Tighten evenly. Uneven contact pressure→Check both sides. Wrong boat type→Verify for process. Excessive current(>900A)→Reduce. Wire pooling unevenly→Check spout alignment.

═══ TYPICAL PLANT CONTEXT ═══

LOCATION: (configure per plant)
MACHINES: Metalliser-1 (3300mm), Metalliser-2 (3650mm)
PRODUCTS: Metallized PET, BOPP, CPP, Nylon + AlBond/AlOx
SAP TRANSACTIONS (example): COR1 production confirmation, plant-specific T-codes for met jumbo & slit
QUALITY GRADES: 2=A-grade(good), 3=B-grade(below spec), 5=Salvageable(re-slit), 6=Scrap
B-GRADE TARGET: ZERO!
CHANGEOVER TARGET: <45 minutes
WASTE TARGET: <0.8%
LINE SPEED TARGET: ~820 m/min (product dependent)
SHIFTS: A/B/C rotation
CORE: 6 inch (152mm) standard
PDF LIBRARY: 296 OEM equipment manuals available in app

═══ SAFETY CRITICAL ═══

AlBond/AlOx SAFETY: AlOx dust + Water = Al(OH)₃ + H₂↑ + HEAT (FIRE RISK!). Steel drums only, max 1/3 full, 6mm vent hole, DRY storage, Class D extinguisher ONLY for AlOx fire, NEVER water/CO₂. Slow vent mandatory (VV10C), stop if shields >250°C.

LOTO: Before ANY maintenance: 1)Notify 2)Identify energy sources 3)Isolate(switches,valves,plugs) 4)Apply lock+tag 5)Verify ZERO energy 6)Work 7)Remove LOTO(only installer).

CONFINED SPACE (Chamber Entry): 1)Permit from supervisor 2)Gas test 3)Standby person outside 4)Rescue plan ready 5)P3 respirator for AlBond chambers 6)Communication system.

E-STOP: Removes ALL power. Locations: Both sides of machine + control desk. To reset: Twist+pull E-stop button → Go to E05 panel → Press flashing reset button.

PPE: Safety shoes ALWAYS. Safety glasses ALWAYS. Ear protection near pumps(>85dB). Gloves per task(cotton/heat-resistant/chemical). P3 mask for chamber entry. Harness for height(>1.8m).

INTERLOCK BYPASS: STRICTLY PROHIBITED. Criminal offense under Factories Act. Immediate termination possible. If interlock faulty→Stop machine→Call maintenance→Repair→Test→Resume.

═══ REAL FLOOR EXPERIENCE — PRACTICAL PATTERNS ═══

MULTIPLE EQUIPMENT LOW FLOW: If plasma+booster+chiller ALL show low flow = NOT individual equipment problem! Check MAIN water supply strainer for sludge/debris/rust. 90% cases: Main Y-strainer blocked. Monthly strainer cleaning prevents this.

HAWKEYE PARTIAL SENSOR FAILURE: If consecutive sensors dead (e.g. 28-49) = RIBBON CABLE connector issue, NOT sensor failure. Sensors connected in groups via ribbon cables. One loose/damaged cable = entire group dead. Fix: Open controller cabinet→reseat ribbon cable firmly to END position→verify click. If still dead→replace ribbon cable. Common mistake: teams check probes/optics but miss cable connector.

MULTIPLE ALARMS SAME TIME: Multiple alarms usually = ONE root cause! First alarm in history = real cause, later alarms = consequences. Water flow alarms on 2+ equipment = shared supply problem. Multiple drive faults = power supply/phase loss. Multiple Profibus nodes down = cable/terminator problem.

CABLE CONNECTOR ISSUES: 30% of electrical faults = loose/dirty connectors. Symptoms: intermittent signal loss, group failures, works when pressed. Fix: disconnect→clean pins (contact cleaner)→reconnect firmly→verify lock. Quarterly PM: reseat ALL connectors.

PRACTICAL TROUBLESHOOTING RULES: 1)What changed before problem? 2)Multiple symptoms = one root cause 3)Check simplest thing first (power/cable/valve/filter) 4)First alarm = root cause 5)Compare current vs normal baseline 6)Change ONE thing at a time 7)NEVER skip documentation

═══ BUDGET & COST MANAGEMENT ═══

TWO BUDGET FORMATS AVAILABLE:
Format 1 (Simple): Single sheet, 11 categories A-K (Consumables, Vacuum System, Cooling, Winding, Electrical, Mechanical, OEM Services, Safety/PPE, Calibration, Cleaning, Miscellaneous). Each item: Spec+UOM+Qty+Rate+Amount formula. Auto-calculates subtotals, grand total, cost/machine, cost/month.
Format 2 (Detailed 10-sheet): Sheet1=Budget Summary (routine+emergency+upgradation), Sheet2=SD Planner (month-wise shutdown), Sheet3=Budget Detail (MECH/E&I split+20%hike), Sheet4=Process Consumable (material codes), Sheet5=E&I Spares (min stock+order qty), Sheet6=Justification Essential, Sheet7=Justification Emergency, Sheet8=Actual Expenses (SAP paste), Sheet9=Services/Job Work, Sheet10=Actual vs Proposal.

BUDGET CATEGORIES: Consumables (boats~500/yr, Al wire~12000kg/yr, graphite tape, BN spray, springs, spouts), Lub&Oils (DP oil CVC Silicone4 ₹8500/L, rotary oil VE101/LVO210, booster oil Anderol555), Essential Spares (pump kits, shafts, rollers, seals, bearings), E&I (drives, thyristors, PLC cards, sensors, wire feeder cards), OEM Services (Busch/Aerzen service, Polycold inspection, OEM annual visit, He leak test), Emergency (source box, drum shield, standby pump, polycold compressor), Safety/PPE, Calibration, Cleaning.

JUSTIFICATION FORMAT: Type+Description+Cost(Lakhs)+Reason+Machine+Remaining Life+Repairable?+New Life+Schedule. Link to business impact: machine stop days, breakdown frequency, quality rejection %, safety risk. Attach failure history. Show cost of NOT buying.

BUDGET TIPS: Boat warmup optimization=20-30% longer life.

═══ DEPARTMENT FORMAT DOCUMENTS ═══

MASTER LIST (ML/01): MET/F/01=Metallizer Logbook, MET/F/02=Slitter Logbook, MET/F/04=Slitter Planning (Secondary), MET/F/05=Feed Planning (Primary), MET/F/06=Boat Life Testing, MET/F/07=Daily PM (21pts), MET/F/08=Weekly PM (35pts), MET/F/09=Monthly PM (42pts), MET/F/10=Quarterly Metalliser-1, MET/F/11=Quarterly Metalliser-2, MET/F/12=Weekly+Monthly+Quarterly (IMS format EN+HI), F/PRD/07=Job Card, GMP/F/10=Hygiene Checklist, PS/F/05=Blade Record.

METALLIZER LOGBOOK (F/01): Cycle tracking (Roll Setup/Vacuum+Heating/Running/Vent/Downtime in min), Production Planning (Material/Width/Rolls/OD/Remark), Shift Remarks.

SLITTER LOGBOOK (F/02): Input (Material/Bare Jumbo No/Met Jumbo No/Width/Length/Weight), Output (Batch/Width/Length/Core ID/Roll Position/Joint/Met Side I-O/Gross Wt/Net Wt/Grade/Remarks), Time (Setup/Running/Speed/Downtime/Waste).

BOAT LIFE TESTING (F/06): General Info, Boat Details (Supplier/Type/Size/Material BN-TiB2 or BN-ZrB2/Batch/Resistivity), Process Parameters per cycle (Speed/Width/Wire Dia/Feed Rate/Current/Power%/Vacuum/OD/Times/Length), Quality (Stability/Uniformity/Spitting), Post-trial condition, Comparison & Conclusion.

JOB CARD (F/PRD/07): Red=Metalliser-2, Yellow=Metalliser-1. Input (Film Type/Roll No/Thickness/Width/Length/Weight/Joints), Output (Met Roll No/OD/Length/Weight/Web Breaks).

OIL SCHEDULE: Aerzen Booster=Anderol 555 Annual, Busch Cobra Oil=Anderol 555 Annual, Cobra Coolant=40%Glycol+60%DM Water 5000hrs, DP=CVC Silicone 4 Annual, Winding Gearbox=BP Energol GR-XP 220 Annual, Drum/DTR1 Leadthrough=Castrol Hyspin AWS 10, All other gravity bottles=Castrol Hyspin AWS 68, Chiller Compressor=Polyolester ICI Emkarate 32, Maxcool/Lauda=Solest LT-32.

GMP HYGIENE (F/10): 10 monthly checks — uniform+shoes, hair cap, nails, no jewellery, handwash, wound bandage, no eating/smoking, hanky+wash, sink stocked, locker clean.

═══ WORK INSTRUCTIONS (WI-07 to WI-18) ═══
WI-07: Shield/Shutter Cleaning — Remove shields, copper rod+scrapper clean Al deposits, 2mm SS scrapper for drum side, copper brush (no scratches), BN suspension paint, adjust gap uniform, select shield per width.
WI-08: Film Threading — Clean roll, check met side, double face tape joints, driven threading belt (manual if auto fails), measure diameter, close chucks, pivot arm approach, start tensions.
WI-11: Metallization Process — Feed computer data, select SOP, vacuum reach→boat heating start, boats stable→wire feed ON, evap stable→web 4m/s, speed reach→shutter open, increase speed to desired, quality check, stop diameter→venting.
WI-12: Open Chamber — Vent complete verify, behind moveable zone area FREE, rail track clear, enable+open buttons.
WI-13: Quality Inspection — Check top 10 layers, defect→control parameters, if not controlled→stop+open+solve, balance roll, write logbook+job card with issues.
WI-17: Film Waste Disposal — Shift end: Bare waste weigh→Erema plant, Met waste (sheet+trim+offcut) weigh→D-Met plant, End cores→core scrap yard. Date/Shift/Machine/Sign on register+bags.
WI-18: Source Clean+New Boats — Remove old boats, copper rod clean clamps/spouts/walls, collect Al, remove bottom plate+clean, vacuum cleaner, Scotch-Bright copper contacts, BN paint all surfaces, fix new boats+graphite tape, adjust wire touch, verify fit. Bulk rate contracts=5-15% savings. ₹1 PM saves ₹4-8 breakdown. Monthly review: spend vs budget, top items, variance analysis. Emergency ratio target <20%.`;


function rAskAI(pg){
  // AI Expert available for ALL users (+ Dhakad Gyan)
  // Key already loaded at init via _decK
  var hasKey=_aiAPIKey&&_aiAPIKey.length>10;

  var html='<div class="ai-chat-wrap">';
  html+='<div class="ai-header"><button onclick="nav(\'home\')" style="background:none;border:none;color:#a78bfa;font-size:22px;cursor:pointer;padding:4px 8px;margin-right:4px" title="Back">←</button><span style="font-size:28px">🤖</span><div><div style="font-weight:900;font-size:18px;color:#fff;font-family:Rajdhani,sans-serif;letter-spacing:.03em">MetTrain AI Expert</div><div style="font-size:12px;color:#a78bfa;font-weight:600">BOBST K5 Expert • 671 Answers • 296 OEM Manuals</div></div><button onclick="document.getElementById(\'ai-settings-modal\').style.display=\'flex\'" style="background:none;border:none;color:#a78bfa;font-size:18px;cursor:pointer;padding:4px 8px;margin-left:auto" title="Settings">⚙️</button></div>';

  // Always show chat — works FREE with offline Q&A, API is optional upgrade
  // Chat messages area
  html+='<div id="ai-msgs" style="flex:1;overflow-y:auto;padding:12px 12px 80px">';
  // Welcome message
  if(_aiHistory.length===0){
    html+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">';
    html+='<b>नमस्ते! मैं MetTrain AI Expert हूँ 🙏</b><br><br>';
    html+='मुझसे BOBST K5 Expert मशीन और सभी auxiliary equipment के बारे में कुछ भी पूछो:<br>';
    html+='• Vacuum system — Cobra pump, Aerzen booster, diffusion pump<br>• Evaporation — boats, wire feeders (Stögra), thyristors (Thyro-A)<br>• Winding & tension — drives (ATV71, G120C, Unidrive SP)<br>• Sensors — MKS Baratron, Pirani, IFM flow/temp/proximity<br>• Chiller system — GRE 24-80kW heater-chiller<br>• PLC & automation — B&R X20, Siemens ET200, Profibus<br>• Pneumatics — Festo cylinders, valves, FRL<br>• Alarms & troubleshooting • PM schedule<br>• Plasma treater • AlBond/AlOx process<br>• OD control & Hawkeye • Recipes & HMI<br>';

    html+='</div></div>';
  } else {
    // Render existing history
    for(var i=0;i<_aiHistory.length;i++){
      var m=_aiHistory[i];
      if(m.role==='user'){
        html+='<div class="ai-msg ai-user"><div class="ai-bubble ai-bubble-user">'+escH(m.content)+'</div></div>';
      } else {
        html+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">'+formatAIReply(m.content)+_detectFmt(m.content,'')+_dlBar(i)+'</div></div>';
      }
    }
  }
  html+='</div>';

  // Budget download buttons
  html+='<div style="padding:6px 12px;display:flex;gap:8px;flex-wrap:wrap">';
  html+='<button onclick="downloadBudget(\'simple\')" style="background:linear-gradient(135deg,rgba(76,175,80,.2),rgba(76,175,80,.08));border:1.5px solid rgba(76,175,80,.5);border-radius:10px;padding:8px 14px;color:#4CAF50;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px" ontouchstart="">📥 Budget Format (Simple)</button>';
  html+='<button onclick="downloadBudget(\'detailed\')" style="background:linear-gradient(135deg,rgba(33,150,243,.2),rgba(33,150,243,.08));border:1.5px solid rgba(33,150,243,.5);border-radius:10px;padding:8px 14px;color:#2196F3;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px" ontouchstart="">📥 Budget Format (Detailed)</button>';
  html+='</div>';

  // Quick question chips
  html+='<div id="ai-quick" style="padding:6px 12px;overflow-x:auto;white-space:nowrap">';
  var chips=[
    'Vacuum pump sequence क्या है?',
    'Boat warmup कैसे करें?',
    'Web break हो जाए तो?',
    'OD control कैसे काम करता है?',
    'Alarm 348 क्या है?',
    'Weekly PM checklist',
    'AlBond process steps',
    'annual budget format metalliser',
    'budget mein kya include kare',
    'Tension settings for PET 12μm',
    'Plasma treater arcing fix',
    'Cobra pump maintenance',
    'Thyro-A error LED meaning?',
    'Chiller alarm troubleshoot',
    'Stepper motor wire feeder setup',
    'Kickert spreader angle setting',
    'ATV71 trip code meaning?',
    'Profibus node failure fix',
    'MKS Baratron calibration',
    'Pirani gauge range?',
    'Festo cylinder speed adjust',
    'IFM flow sensor check'
  ];
  for(var c=0;c<chips.length;c++){
    html+='<button class="ai-quick-btn" onclick="askAI(\''+chips[c].replace(/'/g,"\\'")+'\')">'+chips[c]+'</button>';
  }
  html+='</div>';

  // Input area
  html+='<div class="ai-input-wrap" id="ai-input-area">';
  html+='<div style="display:flex;gap:8px;align-items:flex-end">';
  html+='<textarea id="ai-inp" rows="2" placeholder="🔍 कोई भी सवाल पूछो... (Hindi, English या Hinglish)" style="flex:1;padding:14px;border-radius:14px;border:2px solid #444;background:#1a1a2e;color:#fff;font-size:15px;resize:none;max-height:100px;font-family:inherit;outline:none" onfocus="this.style.borderColor=\'#8b5cf6\'" onblur="this.style.borderColor=\'#444\'" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();askAI();}"></textarea>';
  html+='<button id="ai-send-btn" onclick="askAI()" style="width:48px;height:48px;border-radius:14px;border:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-size:20px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(139,92,246,.3)">➤</button>';
  html+='</div>';
  html+='<div style="text-align:center;padding:6px;font-size:11px;color:#666">🆓 671 Expert Answers — FREE Offline • Hindi + English + Hinglish'+(hasKey?' • 🤖 Gemini AI Active':'')+'</div>';
  html+='</div>';

  // Settings gear
  html+='<div style="position:absolute;top:12px;right:12px">';
  html+='<button onclick="toggleAdvAI()" style="background:none;border:none;color:#444;font-size:11px;cursor:pointer;font-family:inherit" title="Advanced Settings">⚙️</button>';
  html+='</div>';
  // Hidden advanced panel
  html+='<div id="ai-adv-panel" style="display:none;padding:12px;background:#1a1a2e;border:1px solid #333;border-radius:10px;margin:8px 12px">';
  if(hasKey){
    html+='<div style="font-size:12px;color:#25d366;margin-bottom:8px;font-weight:700">✅ Gemini AI Active — सभी devices पर काम करेगा!</div>';
    html+='<div style="font-size:11px;color:#888;margin-bottom:8px">API Key app में saved है। कोई भी device पर open करो — AI answer मिलेगा।</div>';
    html+='<button onclick="removeEmbeddedKey()" style="padding:6px 12px;border-radius:6px;border:1px solid #444;background:none;color:#888;font-size:11px;cursor:pointer">🗑️ Key हटाओ</button>';
  } else {
    html+='<div style="font-size:12px;color:#f0a500;margin-bottom:10px;font-weight:700">🔑 Gemini API Key Setup (एक बार करो, सब device पर चलेगा!)</div>';
    html+='<div style="font-size:11px;color:#888;margin-bottom:8px;line-height:1.6">';
    html+='<b>Step 1:</b> <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#8b5cf6;text-decoration:underline">aistudio.google.com/apikey</a> पर जाओ → Free key बनाओ<br>';
    html+='<b>Step 2:</b> नीचे key paste करो → "Save & Download" दबाओ<br>';
    html+='<b>Step 3:</b> Downloaded file को GitHub Desktop से push करो → Done!</div>';
    html+='<input type="text" id="ai-key-inp" placeholder="AIzaSy..." style="width:100%;padding:10px;border-radius:8px;border:2px solid #444;background:#111;color:#fff;font-size:13px;margin-bottom:8px;box-sizing:border-box;font-family:monospace" onfocus="this.style.borderColor=\'#8b5cf6\'" onblur="this.style.borderColor=\'#444\'">';
    html+='<button onclick="saveAndDownloadKey()" style="padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font-size:13px;cursor:pointer;font-weight:700;width:100%">💾 Save & Download App with Key</button>';
    html+='<div style="font-size:10px;color:#555;margin-top:6px;text-align:center">Downloaded file में key embedded होगी — GitHub push करो → सब device पर AI चालू!</div>';
  }
  html+='</div>';

  html+='</div>';
  pg.innerHTML=html;

  // Auto-scroll to bottom
  setTimeout(function(){
    var msgs=document.getElementById('ai-msgs');
    if(msgs)msgs.scrollTop=msgs.scrollHeight;
  },100);
}

function saveAndDownloadKey(){
  var inp=document.getElementById('ai-key-inp');
  if(!inp||!inp.value.trim()){showToast('❌ API Key paste करो');return;}
  var key=inp.value.trim();
  if(!key.startsWith('AIza')||key.length<30){
    showToast('❌ Invalid key — AIzaSy... format होना चाहिए');return;
  }
  // Save to localStorage for immediate use
  _aiAPIKey=key;
  mtSave('ai_api_key',key);
  // Encode key (XOR obfuscation — not plain text in source!)
  var encoded=_encK(key,_AI_KEY_SALT);
  // Generate new HTML with encoded key embedded
  var currentHTML=document.documentElement.outerHTML;
  currentHTML=currentHTML.replace(
    /var _AI_KEY_ENC='[^']*'/,
    "var _AI_KEY_ENC='"+encoded+"'"
  );
  // Download
  var blob=new Blob(['<!DOCTYPE html>\n<html lang="hi">\n'+currentHTML+'</html>'],{type:'text/html'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='MetalTrain_Pro_v7_Mobile.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Key saved! File downloaded — GitHub push करो!');
  setTimeout(function(){
    var pg=document.getElementById('pg-askai');
    if(pg){delete pg.dataset.r;rAskAI(pg);}
  },500);
}

function removeEmbeddedKey(){
  if(!confirm('API Key हटाना है? Re-push करना होगा'))return;
  _aiAPIKey='';
  _aiHistory=[];
  mtRemove('ai_api_key');
  var currentHTML=document.documentElement.outerHTML;
  currentHTML=currentHTML.replace(
    /var _AI_KEY_ENC='[^']*'/,
    "var _AI_KEY_ENC=''"
  );
  var blob=new Blob(['<!DOCTYPE html>\n<html lang="hi">\n'+currentHTML+'</html>'],{type:'text/html'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='MetalTrain_Pro_v7_Mobile.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('🗑️ Key removed! GitHub push करो');
  setTimeout(function(){
    var pg=document.getElementById('pg-askai');
    if(pg){delete pg.dataset.r;rAskAI(pg);}
  },500);
}

function toggleAdvAI(){
  var p=document.getElementById('ai-adv-panel');
  if(p) p.style.display=p.style.display==='none'?'block':'none';
}

function escH(s){
  var d=document.createElement('div');d.textContent=s;return d.innerHTML;
}

function formatAIReply(txt){
  // Convert markdown-like formatting to HTML
  var h=escH(txt);
  // Bold
  h=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  // Code blocks
  h=h.replace(/```([\s\S]*?)```/g,'<pre style="background:#1a1a2e;padding:8px;border-radius:6px;overflow-x:auto;font-size:12px">$1</pre>');
  // Inline code
  h=h.replace(/`(.+?)`/g,'<code style="background:#1a1a2e;padding:2px 5px;border-radius:3px;font-size:12px">$1</code>');
  // Bullet points
  h=h.replace(/^[•\-]\s(.+)$/gm,'<div style="padding-left:12px">• $1</div>');
  // Numbered lists
  h=h.replace(/^(\d+)\.\s(.+)$/gm,'<div style="padding-left:12px"><b>$1.</b> $2</div>');
  // Tables (simple | delimited)
  h=h.replace(/\|(.+)\|/gm,function(m,content){
    var cells=content.split('|').map(function(c){return c.trim();});
    if(cells.every(function(c){return /^[-:]+$/.test(c);}))return ''; // separator row
    var tag=cells[0]&&cells[0].indexOf('---')>=0?'td':'td';
    return '<div style="display:flex;gap:4px;padding:2px 0;font-size:12px">'+cells.map(function(c){return '<span style="flex:1;padding:2px 6px;background:#111;border-radius:4px">'+c+'</span>';}).join('')+'</div>';
  });
  // Diagram blocks [DIAGRAM]...[/DIAGRAM]
  h=h.replace(/\[DIAGRAM\]([\s\S]*?)\[\/DIAGRAM\]/g,'<div class="ai-diagram">$1</div>');
  // Image blocks [IMG:url]
  h=h.replace(/\[IMG:(.+?)\]/g,'<div style="margin:8px 0"><img src="$1" style="max-width:100%;border-radius:8px;border:1px solid #333" onerror="this.style.display=\'none\'"></div>');
  // Line breaks
  h=h.replace(/\n/g,'<br>');
  return h;
}

// ══════════════════════════════════════════════════════
// FREE OFFLINE Q&A ENGINE — ₹0 FOREVER, NO API NEEDED
// 592 expert answers from BOBST K5 + 250 equipment manuals
// ══════════════════════════════════════════════════════
var QA_DB=[
// ── VACUUM SYSTEM ──
{k:'vacuum pump sequence पम्प सीक्वेंस pumpdown पंपडाउन start शुरू',a:'**Vacuum Pumpdown Sequence (BOBST K5 Expert):**\n\n1. **Roughing Pump (Busch Cobra NC 630)** — पहले RP1 start करो। ये dry screw pump है, atmospheric से ~10 mbar तक pump करता है।\n2. **Mechanical Booster (Aerzen GM2000/GL8000)** — ~10 mbar पर BP engage होता है। Roots-type blower है, Cobra के साथ मिलकर ~1×10⁻³ mbar तक ले जाता है।\n3. **Diffusion Pump (Varian NHS-20)** — DP को पहले pre-heat करो (oil temp 220°C required)। फिर VV7 valve open होता है — high vacuum zone connect होता है।\n4. **Cryogenic Coils (Brookes/Polycold)** — -120°C पर coils activate — water vapor trap करती हैं।\n\n✅ Final vacuum: Evaporation zone <8×10⁻⁴ mbar\n✅ Winding zone: ~2×10⁻² mbar\n\n[DIAGRAM]\n🔵 <b>COBRA NC 630</b> (Dry Screw)\n     ⬇ 1013 → 10 mbar\n🟢 <b>AERZEN GM2000</b> (Roots Booster)\n     ⬇ 10 → 1×10⁻³ mbar\n🟣 <b>VARIAN NHS-20</b> (Diffusion Pump)\n     ⬇ → 8×10⁻⁴ mbar\n❄️ <b>POLYCOLD</b> (Cryo Coils -120°C)\n     ⬇ Water vapor trap\n✅ <b>PROCESS READY</b>\n[/DIAGRAM]\n\n⚠️ **Safety:** Diffusion pump MUST reach 220°C before VV7 opens. Cold DP = oil backstreaming = contamination!'},

{k:'cobra pump busch maintenance service कोबरा पम्प मेंटेनेंस सर्विस',a:'**Busch Cobra NC 630 C — Maintenance Guide:**\n\nये oil-free dry screw pump है — तेल बदलने की ज़रूरत नहीं!\n\n**Regular Checks:**\n• Inlet filter — हर हफ्ते check, monthly clean/replace\n• Cooling water flow — pump बिना water नहीं चलाना! Direct cooling system है।\n• Seal condition — vibration या unusual noise = seal wear\n• Exhaust filter — check for blockage\n\n**Troubleshooting:**\n• Pump slow/noisy → Inlet filter blocked या cooling water low\n• High temperature alarm → Cooling water supply check करो (>3 bar feed pressure required)\n• Won\'t start → Check motor breaker, overload relay, power supply\n\n⚠️ AlBond process: Cobra exhaust में air dilution system है — O₂ max 23% in exhaust। PTFE tape NEVER use on O₂ lines — only Cobas Green Oxygen tape!'},

{k:'diffusion pump डिफ्यूज़न पम्प oil तेल startup shutdown',a:'**Diffusion Pump (Varian NHS-20):**\n\n**Oil:** CVC Silicone 4 — capacity 4.7L\n\n**Startup:**\n1. Cooling water ON (mandatory!)\n2. Heater ON — oil को 220°C तक गर्म होने दो\n3. 220°C पर ready — अब VV7 open कर सकते हो\n\n**Shutdown:**\n1. VV7 close करो\n2. Heater OFF\n3. Cooling water ON रखो जब तक oil ठंडा न हो जाए\n\n**HMI Colors:**\n• Grey = Off/Closed\n• White = Running/Open\n• Alternating = Transitioning\n• Red = Fault\n\n⚠️ कभी cooling water बंद करके DP मत चलाओ — oil crack हो जाएगा = pump damage!'},

{k:'vacuum leak लीक pressure rise test प्रेशर',a:'**Vacuum Leak Detection:**\n\n**Leak Causes:**\n• Air leak — O-ring damage, door seal, viewing window\n• Internal water leak — chiller pipe, cooling connection\n• Unclean machine — AlOx dust absorbs moisture\n• Outgassing substrate — wet/dirty film roll\n• Pump failure — DP oil low, Cobra seal worn\n\n**Pressure Rise Test:**\n1. Pump down to working vacuum\n2. Close all valves (isolate chamber)\n3. Measure pressure rise over time\n4. **Acceptable: <30 microns rise**\n5. Above 30 microns = leak hunting needed\n\n**Helium Leak Detection:**\n• Fine leaks के लिए He detector use करो\n• Helium spray outside → detector inside picks up\n• O-rings, door seals, feedthroughs check करो\n\n⚠️ सबसे common leak: O-ring damage — हर cycle check करो!'},

{k:'vent venting sequence वेंट वेंटिंग',a:'**Venting Sequence (BOBST K5):**\n\n**Standard Al Metallizing:**\n1. **VV10A** (winding zone) पहले open होता है\n2. **VV10B** (evaporation zone) ~400 mbar पर open होता है\n3. Chamber slowly atmospheric pressure तक आता है\n\n**AlBond/AlOx Process:**\n• Slower **VV10C** valve use होता है (controlled venting)\n• Shield temperature monitoring — **250°C से ऊपर हो तो vent STOP!**\n• AlOx dust reactive है — fast venting = fire risk\n\n**Shutdown:**\n• Vacuum HMI पर Shutdown press करो\n• 30-50 min sequence — partial pump to 500 mbar पहले, फिर full shutdown\n\n⚠️ AlOx waste: Steel drums में seal करो, 6mm vent hole, max 1/3 full!'},

{k:'pirani gauge पिरानी गेज mks 925 micropirani range',a:'**MKS 925 MicroPirani Vacuum Gauge:**\n\n**Range:** 1×10⁻⁴ to 1000 Torr (एक gauge में atmospheric to high vacuum!)\n**Principle:** Thermal conductivity — gas molecules heat sensor filament\n\n**Output:**\n• Analog: 0-10V\n• Digital: RS485/RS232\n• 2 relay setpoints — pump interlock/alarm के लिए configure करो\n\n**Gas Correction:**\n• Factory calibration: N₂/Air\n• Argon, O₂ के लिए correction factor लगाना पड़ता है\n\n**Use in BOBST K5:** Pumpdown monitoring, pump crossover switching\n\n⚠️ Contaminated filament = wrong reading। Dirty vacuum या oil backstreaming से filament खराब होती है।'},

{k:'baratron बरैट्रॉन mks 627b capacitance manometer pressure gauge calibration',a:'**MKS Baratron 627B — Capacitance Manometer:**\n\n**Type:** Absolute pressure transducer\n**Advantage:** Gas composition से independent — सबसे accurate vacuum gauge!\n**Ranges:** 0.1, 1, 10, 100, 1000 Torr full scale\n**Output:** 0-10V DC proportional to pressure\n**Accuracy:** 0.12% of reading\n\n**Calibration:**\n• Zero: Pump down to <10% of full scale → adjust zero\n• Span: Factory calibrated, NIST traceable\n\n**Connection:** 15-pin D-sub connector\n\n**Use in BOBST K5:** High-accuracy process pressure measurement in evaporation zone\n\n⚠️ Handle with care — capacitance diaphragm delicate है!'},

{k:'penning gauge cold cathode edwards aim magnetron high vacuum',a:'**Edwards AIM — Active Inverted Magnetron Gauge:**\n\n**Type:** Cold cathode / Penning gauge (high vacuum)\n**Range:** 1×10⁻⁹ to 1×10⁻² mbar\n**Models:** AIM-S, AIM-SL, AIM-X, AIM-XL (NW25 flange)\n\n**Use:** Evaporation chamber high vacuum measurement\n**Degas function:** Built-in — accurate low-pressure readings के लिए\n\n**Note:** Magnetic field based — metallic particles or contamination = wrong readings\n\n⚠️ Don\'t run at atmospheric — gauge damage हो सकता है। Always interlock with roughing pump!'},

// ── EVAPORATION SYSTEM ──
{k:'boat warmup kaise kare बोट वार्मअप new old नई पुरानी गरम ceramic boat kaise garam kare',a:'**Boat Warmup Procedure:**\n\n**New Boat (पहली बार):**\n• 12 min ramp to ~500°C, फिर faster ramp\n• HMI पर "NEW BOAT" setting select करो\n• Slowly heat → thermal shock से boat crack होती है\n\n**Old Boat (पहले से used):**\n• 4 min ramp — faster because already seasoned\n• HMI पर "OLD BOAT" setting (default after first use)\n\n**Installation:**\n1. Boats install करो — **Graphite tape** at both ends for electrical contact\n2. Copper contact blocks check — bolts tight, no oxidation\n3. Release agent (Boron Nitride) shields पर spray करो\n\n**Temperature:** 1450-1500°C at ~750A/10V\n\n⚠️ **Safety:** Boats extremely hot — PPE mandatory! Never touch during or just after operation।'},

{k:'wire feeder stepper motor stogra वायर फीडर स्टेपर',a:'**Wire Feeder System (Stögra Stepper Motors):**\n\n**Drive:** Stögra SERS 02/06/12 stepper motor amplifier\n• SERS 02: 2A, SERS 06: 6A, SERS 12: 12A\n• RS232/RS485 interface for programming\n• DIP switches: drive number, baud rate, auto-start\n\n**Motors:** Stögra SM 87/107/168 series\n• 2-phase stepper motors\n• Bipolar wiring (parallel = more torque, serial = more speed)\n• Color: brown/white/black/red/blue/grey/yellow/green\n• Brake option available (suffix B/BE50)\n\n**Wire Feed:**\n• Base speed: typically 20 cm/min\n• OD Auto mode: PLC adjusts wire feed to maintain uniform OD\n\n**PM Schedule:**\n• Weekly: Check clamp/guide tube\n• Monthly: Turn drive wheel to 2nd groove, check springs, clean spouts\n• Quarterly: Clean rotating arms\n• Bi-annual: Replace bearings/springs/drive wheels'},

{k:'thyristor thyro-a power controller boat heater evaporation source thyro थायरिस्टर',a:'**AE Thyro-A — Thyristor Power Controller:**\n\n**Function:** Ceramic evaporation boats को AC power control करता है\n**Manufacturer:** Advanced Energy\n\n**Operating Modes:**\n• **TAKT** — Full wave switching (most common)\n• **VAR** — Phase angle control (smooth)\n• **QTM** — Half wave switching\n\n**Control:**\n• Input: 0-10V or 4-20mA setpoint\n• PID control capability\n• DIP switches S1 से configure करो\n\n**Monitoring:**\n• LED error codes on front panel\n• Fault relay K1 — external alarm connection\n• Mains voltage, load current, device temperature monitoring\n\n**Error LEDs:**\n• Green steady = OK\n• Red flashing = Over-temperature\n• Red steady = Thyristor short/open circuit\n• Yellow = Load fault\n\n**Bus Module:** Ethernet IP or Profibus optional\n\n⚠️ High voltage! Only trained electricians should work on Thyro-A!'},

{k:'od control optical density ओडी कंट्रोल hawkeye हॉकआई inline monitor',a:'**OD Control System & Hawkeye Inline Monitor:**\n\n**Hawkeye System:** 5 optical probes — measures:\n• OD (Optical Density) — metal thickness\n• Resistivity (Ohms/sq)\n• Light Transmission (%T)\n\n**OD Control Modes:**\n1. **Stop** — System off\n2. **Warm-up/Standby** — 100% base wire speed\n3. **Manual** — Individual channel control\n4. **Auto** — PLC adjusts wire feed to maintain uniform OD\n   - Within 60% band = normal auto control\n   - Outside 30% band = drops to standby (safety)\n\n**Optimum Set-Point:** Last run\'s wire feed values remember करता है — faster startup next cycle\n\n**OD Curve:** Recipe-based conversion between online OD and offline lab densitometer (X-Rite 301)\n\n**Alarms:** Configurable high/low warning and alarm levels as % of target\n\n**Deposit Table:** Sampled every 30 sec with time + length position\n\n[DIAGRAM]\n🎯 <b>OD Control Flow:</b>\n📡 Hawkeye 5 Probes → OD/Resistance/Transmission\n   ⬇\n🧮 PLC compares vs Recipe Target\n   ⬇\n⚡ Adjusts Wire Feed Speed (Auto Mode)\n   ⬇\n🔥 More/Less Al evaporation\n   ⬇\n✅ Uniform coating across width\n[/DIAGRAM]'},

{k:'shutter शटर open close speed operation',a:'**Coating Shutter Operation:**\n\n**Minimum open speed:** 120 m/min\n**Opens:** Automatically at set % of line speed\n\n**Rules:**\n• Shutter MUST be CLOSED for winding cart to enter chamber\n• Pneumatic cylinder operated — Festo standard cylinder\n• Guide rail + roller + gearbox mechanism\n\n**PM Schedule:**\n• Quarterly: Clean cylinder housing, guide rails, gearbox breather\n• Annual: Replace gearbox oil, inspect lifting cables\n• 3 Years: Replace lifting cables\n\n**Alignment:** Test for air leaks with snoop/helium detector after maintenance'},

{k:'copper contact block कॉपर कॉन्टैक्ट ब्लॉक replacement बदलना',a:'**Copper Contact Block Replacement:**\n\n**Design:**\n• Neutral side = water-cooled\n• Live side = non-cooled\n• Can rotate 180° for second use (doubles life!)\n\n**Replacement Steps:**\n1. Machine OFF, LOTO applied\n2. Disconnect water lines (neutral side)\n3. Loosen bolts — use **Rocol J166 anti-seize** on removal\n4. Remove old block, clean mating surfaces\n5. Install new block with fresh Rocol J166 on bolts\n6. Tighten evenly — good electrical contact critical\n7. Reconnect water, test for leaks\n\n**Source Height:** Adjustable via jacking bolts\n• Closer to drum = better collection efficiency but more heat\n• Must level with spirit level\n\n⚠️ SOP-08 follow करो। PPE mandatory — safety goggles + gloves!'},

// ── WINDING SYSTEM ──
{k:'web path roller वेब पाथ रोलर winding threading',a:'**Web Path — BOBST K5 Expert:**\n\n**Full Path (14 stations):**\n1. **Unwind** (film roll)\n2. **Unwind Layon** roller\n3. **Spreader** (Kickert bowed roller)\n4. **Load Cell** (tension measurement)\n5. **Cork Draw CVD1** (master draw roller)\n6. **Bowed Roller** (spreading)\n7. **Water Cooled Drum WCD** (process drum)\n8. **Water Cooled Roller DTR1/WCR**\n9. **Cork Draw DTR2** (ebonite)\n10. **Bow Spreader**\n11. **Load Cell** (rewind tension)\n12. **Bow Spreader**\n13. **Rewind Layon**\n14. **Rewind** (finished roll)\n\n**Direction:** Underwind or overwind selectable for both sides\n**Core:** 6" (152mm OD), spirally wound cardboard, wall thickness 14-17mm\n\n[DIAGRAM]\n📦 <b>UNWIND</b> → 🔄 Layon → 〰️ <b>SPREADER</b>\n   → ⚖️ Load Cell → 🎯 <b>CVD1 (Draw)</b>\n   → 〰️ Bowed → 🥁 <b>WCD (Drum)</b>\n   → ❄️ DTR1/WCR → 🎯 DTR2\n   → 〰️ Spreader → ⚖️ Load Cell\n   → 〰️ Spreader → 🔄 Layon → 📦 <b>REWIND</b>\n[/DIAGRAM]'},

{k:'tension settings टेंशन सेटिंग pet bopp nylon cpp film substrate',a:'**Tension Settings by Substrate:**\n\n| Substrate | Tension (N/1000mm) |\n|-----------|-------------------|\n| PET 12μm | 31-40 N |\n| BOPP 20μm | 36-44 N |\n| Nylon 12μm | 31-40 N |\n| CPP 25μm | 3.2-8 N |\n\n**Taper/Profile Tension:**\n• Paper: Decrease tension as diameter grows\n• Large PET rolls: May need slight increase\n\n**Drive Modes:**\n• **Draw** — Closed loop, % speed reference to CVD1\n• **Torque** — Open loop, N force\n• Drum/DTR1/DTR2 slightly faster than draw roller\n\n**Gain Settings:**\n• Higher values: Soft films (CPP, LDPE)\n• Lower values: Stiff films (BOPP, PET, Paper)\n\n⚠️ CPP बहुत sensitive है — tension ज़रा ज़्यादा = film stretch/damage!'},

{k:'web break वेब ब्रेक film break detection',a:'**Web Break — Emergency Response:**\n\n**Auto Detection:** Tension drops below 3% of full range → automatic fast stop\n\n**What Happens Automatically:**\n1. Fast stop (10-20 sec)\n2. Shutter CLOSES\n3. Wire feed STOPS\n4. Boats power OFF\n5. Layarm drives into roll (minimize substrate loss)\n\n**Operator Action:**\n1. Don\'t panic! System handles emergency stop\n2. Check break location — unwind, drum area, or rewind?\n3. Check for debris on drum/rollers\n4. Clean any contamination\n5. Re-thread web (motorised T-belt threader available)\n6. Resume production\n\n**Common Causes:**\n• Bad splice/joint in bare film\n• Excessive tension (check settings!)\n• Debris on roller or drum\n• Core slip — shaft not properly engaged\n\n⚠️ Web break after AlBond process — extra caution! AlOx dust = fire hazard!'},

{k:'spreader kickert bowed roller स्प्रेडर angle setting crease',a:'**Kickert Bowed Roller (Spreader) Setup:**\n\n**Installation Rules:**\n• Entry distance A = 2× exit distance E\n• E ≈ 2.5× roller diameter\n• Web passes over **CONCAVE** side\n\n**Wrapping Angles (Film Industry):**\n• PP/PA 1-6 μm: 60-90°\n• PP/PA 8-20 μm: 45-60°\n• >20 μm: 45°\n• **Metallised films: 15-20°**\n\n**Adjustment:**\n• **Creasing problem:** Equal entry/exit angles (basic setting)\n• **Slack edges:** Decrease wrap angle around concave side\n• **Slack centres:** Increase wrap angle around convex side\n\n**PM Schedule:**\n• Weekly: Check rubber sleeve + motor operation + apex position\n• 5 Years: Send for full overhaul\n\n⚠️ Alignment critical — both vertically and horizontally on web!'},

{k:'roll loading unloading shaft chuck chucking रोल लोडिंग शाफ़्ट चक',a:'**Roll Loading/Unloading:**\n\n**Shaft:** Svecom 152mm (6") mechanical expanding shaft\n• Tighten with T-wrench ~100 Nm\n• Must centralize roll on shaft\n\n**Chucking Sequence:**\n1. Female spline engages over male spline\n2. Swing over clamp\n3. Toggle clip locks\n4. Sensors monitor full engagement\n\n**Safety:**\n• Crane capacity >5MT sling belt use करो\n• Safety Helmet mandatory\n• Core Plug at both ends before lifting\n• Check sling belt condition before every lift\n\n**Svecom Shaft Maintenance:**\n• Keys numbered (1, 2, 3...) from drive side\n• Dismantle: Remove dowels → heat surface to ~200°C → extract drive neck\n\n**ETP Express Clamping Hub:**\n• Keyless shaft-hub connection\n• Tighten with specified torque + Molykote G-n plus lubricant\n• NEVER open radial bore in flange!'},

{k:'layarm लेआर्म gap contact mode rewind',a:'**Layarm Settings:**\n\n**Modes:**\n• **GAP mode:** 15-20mm normal, max 50mm\n• **CONTACT mode:** 50-100N normal, max 400N\n• **Back = disabled**\n\n**On web break:** Layarm drives into roll at max torque — minimizes substrate loss\n\n**Reset:** Use layarm reset button after web break or roll change\n**Get Diameter:** Measures current roll diameter for tension calculation'},

// ── ALARM CODES ──
{k:'alarm 312 313 314 315 316 water flow low water अलार्म पानी',a:'**Alarm 312-316: Low Water Flow BP2-BP6**\n\n**Meaning:** Mechanical booster pumps को cooling water flow कम है\n\n**Action:**\n1. Main water supply check करो — feed pressure >3 bar required\n2. Differential pressure >2.5 bar check करो\n3. Water filter/strainer check — blocked?\n4. IFM SM6004 flow sensor check करो\n5. अगर >5 min low flow → pumps auto shutdown\n\n**Temperature Limits:**\n• Warning: 22-28°C\n• Alarm: 30°C\n• Auto shutdown: 10 min at 30°C\n\n⚠️ Summer में water temperature ज़्यादा हो सकता है — chiller capacity check करो!'},

{k:'alarm 322 auto source shut off timeout बोट बंद',a:'**Alarm 322: Auto Source Shut Off**\n\n**Meaning:** Inactivity timeout — boats auto power off हो गए\n\n**Action:** Simply restart boats from HMI\n\n**Why:** Safety feature — अगर कोई operation नहीं हो रहा तो boats automatically बंद हो जाते हैं energy और safety के लिए।'},

{k:'alarm 331 threader circuit breaker tripped थ्रेडर ब्रेकर',a:'**Alarm 331: Web Threader Circuit Breaker Tripped**\n\n**Location:** E06_0 Panel\n\n**Action:**\n1. E06_0 panel खोलो\n2. Threader circuit breaker find करो\n3. Reset करो (switch OFF then ON)\n4. अगर repeatedly trip हो → motor या wiring fault — electrician बुलाओ'},

{k:'alarm 332 crane e-stop emergency क्रेन',a:'**Alarm 332: Crane E-Stop Activated**\n\n**Action:**\n1. Crane area check — कोई hazard तो नहीं?\n2. Crane E-Stop button find करो\n3. Twist/pull to reset\n4. Confirm crane is safe before resuming'},

{k:'alarm 339 340 chuck closed rewind unwind चक बंद',a:'**Alarm 339: Rewind Chucks Not Fully Closed\nAlarm 340: Unwind Chucks Not Fully Closed**\n\n**Action:**\n1. Chuck area check करो — spline properly engaged?\n2. Toggle clip locked?\n3. Proximity switches check — IFM inductive sensors\n4. Re-engage chucks properly\n5. Sensor cleaning — Al dust जमा हो सकती है\n\n⚠️ Chuck not closed = roll can fly off during rotation = SERIOUS DANGER!'},

{k:'alarm 341 342 343 344 varibow spreader fault',a:'**Alarm 341-344: Varibow Spreader Faults**\n\n**Causes:** Contactor/PSU/breaker/drive fault in spreader system\n\n**Action:**\n1. Check contactor — coil OK? Contacts OK?\n2. Power supply unit check\n3. Circuit breaker reset\n4. Drive fault — check drive panel for error code\n5. Technical assistance ज़रूरी हो सकती है'},

{k:'alarm 347 cryogenic fault polycold cg4 क्रायोजेनिक',a:'**Alarm 347: Cryogenic Fault CG4**\n\n**Meaning:** Polycold/Brookes cryogenic system fault\n\n**Action:**\n1. Polycold compressor check — running?\n2. Refrigerant pressure check\n3. Cryo coil temperature check — should reach -120°C\n4. Helium leak test (for Brookes compressor)\n\n**HMI Colors:**\n• White = Standby\n• Light Blue = Cool (normal)\n• Yellow = Defrost\n\n⚠️ Cryo failure = poor vacuum = poor coating quality!'},

{k:'alarm 348 main water pressure low मुख्य पानी प्रेशर कम',a:'**Alarm 348: Main Water Pressure Low**\n\n**Requirements:**\n• Feed pressure: >3 bar\n• Differential: >2.5 bar\n\n**Action:**\n1. Main water supply valve fully open?\n2. Strainer/filter blocked? → Clean PN16 cast iron strainer\n3. Water pump running?\n4. Other machines using excess water?\n5. Check pressure at inlet manifold\n\n**Timer:** If low for >5 min → ALL pumps auto shutdown!\n\n⚠️ Summer peak hours में water pressure drop common — plant water supply schedule check करो!\n\n[DIAGRAM]\n🚰 Main Supply → PN16 Strainer → Manifold\n   → 💧 Cobra Pump cooling\n   → 💧 DP cooling\n   → 💧 Chiller system\n   → 💧 Drum/DTR cooling\n<b>Need: >3 bar feed, >2.5 bar differential</b>\n[/DIAGRAM]'},

{k:'alarm 349 water pressure high प्रेशर ज़्यादा',a:'**Alarm 349: Main Water Pressure High**\n\n**Action:** Pressure regulator check करो — regulating valve stuck open या misadjusted हो सकता है।'},

{k:'alarm 353 464 profibus node failure नोड फेल communication',a:'**Alarm 353-464: Profibus Node Failures**\n\n**Meaning:** Profibus network पर specific node communication lost\n\n**Alarm Number = Node Number:**\n• 353 = Node 1 failure\n• 464 = Node 112 failure\n\n**Troubleshooting:**\n1. **Power check:** Node को 24V supply मिल रही है?\n2. **Cable check:** Purple Profibus cable connected? Damage?\n3. **Connector:** DB9 Fast-Connect plug tight?\n4. **Termination:** Active terminators at both ends of segment?\n5. **LED check:** Module LEDs — green=OK, red=fault, off=no power\n6. **Try:** Power cycle the specific node\n7. **Advanced:** Oscilloscope for telegram analysis\n\n**Common Fix:** 90% cases में cable loose connection या termination problem होती है!\n\n⚠️ Max 32 nodes per segment, max 12 Mbit/s speed'},

// ── DRIVES (VFD) ──
{k:'atv71 drive altivar schneider trip fault code error ड्राइव फॉल्ट एरर',a:'**Schneider Altivar ATV71 — Trip Codes:**\n\n**Common Faults:**\n• **OHF** — Drive overheating → check fan, ambient temp, load\n• **OCF** — Overcurrent → check motor, cable, load jam\n• **OSF** — Overspeed → check encoder, speed reference\n• **OLF** — Motor overload → reduce load or check motor\n• **SCF** — Short circuit → check motor cable insulation\n• **SLF** — Serial link fault → Profibus cable/connection check\n• **InF** — Internal fault → cycle power, if repeated = service\n• **PHF** — Input phase loss → check 3-phase supply\n\n**Reset:** Press STOP/RESET on keypad or via Profibus command\n\n**Communication:** Profibus DP — PPW/PCW telegram format\n**Programming:** Via ATV71 keypad or SoMove software\n\n⚠️ Repeated OCF/SCF = check motor winding insulation with megger!'},

{k:'g120c sinamics siemens drive ड्राइव parameter पैरामीटर',a:'**Siemens SINAMICS G120C:**\n\n**Access:** BOP (Basic Operator Panel) keypad\n**Communication:** Profibus DP / Profinet\n\n**Key Parameters:**\n• P0003 = User access level\n• P0010 = Commissioning mode\n• P0304 = Motor voltage\n• P0305 = Motor current\n• P0307 = Motor power\n• P0311 = Motor frequency\n• P1082 = Max frequency\n• P1120 = Ramp up time\n• P1121 = Ramp down time\n\n**Safety Integrated:**\n• STO (Safe Torque Off) — removes motor power\n• SS1 (Safe Stop 1) — controlled stop then STO\n\n**Commissioning:** Set motor nameplate data → P1910=1 → auto-tune\n\n⚠️ P0010 = Quick commissioning mode — always start here for new motor!'},

{k:'unidrive sp control techniques nidec trip fault parameter',a:'**Control Techniques Unidrive SP:**\n\n**Common Trip Codes:**\n• **OI.AC** — Overcurrent (acceleration)\n• **OI.br** — Overcurrent (braking)\n• **OI.dC** — Overcurrent (DC injection)\n• **OV** — DC bus overvoltage\n• **th** — Drive over-temperature\n• **It.AC** — Motor thermal overload\n• **SL** — Slot communication fault (SM module)\n• **PS** — Power stage fault\n\n**Auto-tune:** Run auto-tune for motor characterization — essential for good control!\n\n**SM Modules (Option Slots):**\n• SM-Profibus DP — for PLC communication\n• SM-IO Plus — extra analog/digital IO\n• SM-Encoder Plus — for SSI, BiSS, SinCos, Resolver\n• SM-Applications — PLC function blocks built-in\n\n**CTNet:** Peer-to-peer drive network for master/slave operation'},

// ── CHILLER ──
{k:'chiller चिलर coolant glycol temperature cooling alarm fault troubleshoot',a:'**Bobst Chiller/Heater System (GRE):**\n\n**Capacities:** 24kW, 40kW, 80kW\n**Coolant:** Ethylene glycol/water mixture\n• **Specific gravity: 1.080 at 20°C** = -30°C freezing protection\n• Test with **hydrometer** regularly!\n\n**Refrigerant:** R407C or R410A\n\n**Functions:** Maintains drum, DTR, water-cooled roller temps\n• CPP metallization: Drum temp -20°C required\n\n**Common Alarms:**\n• Low pressure → Refrigerant leak? Check with soapy water\n• High pressure → Condenser dirty? Clean coils\n• Low flow → Coolant level low? Check expansion tank\n• High temperature → Compressor fault? Check refrigerant charge\n\n**Maintenance:**\n• Weekly: Check coolant level & specific gravity\n• Monthly: Clean condenser coils (dust/Al dust)\n• Quarterly: Check refrigerant pressures\n• Annual: Inspect compressor, check electrical connections\n\n⚠️ Coolant SG 1.080 critical — too dilute = freezing risk, too concentrated = poor heat transfer!\n\n[DIAGRAM]\n❄️ <b>CHILLER CIRCUIT:</b>\n🔧 Compressor → Condenser → Expansion Valve\n   → Evaporator (heat exchange) → back to Compressor\n💧 <b>COOLANT CIRCUIT:</b>\nPump → Drum (-20°C) → DTR1 → WCR → Return Tank\n🌡️ <b>Check:</b> SG 1.080 @ 20°C = -30°C protection\n[/DIAGRAM]'},

// ── PLASMA TREATER ──
{k:'plasma treater प्लाज़्मा arcing arc treatment adhesion pre-treatment',a:'**Plasma Treater — Troubleshooting Arcing:**\n\n**System:** AC magnetron electrode, process gas (Ar, N₂, O₂, or mixed)\n**Pressure:** 4×10⁻² to 8×10⁻² mbar in treater enclosure\n\n**Arcing Causes:**\n• Dirty electrodes (Al/AlOx buildup)\n• Damaged electrode surface\n• Incorrect gas pressure/flow\n• Anti-backside shield misaligned\n\n**Fix:**\n1. **Basic cleaning:** IPA/acetone + lint-free cloth + fine abrasive paper\n2. **Deep cleaning:** Orbital sander with min 250-grade (ideally 1000-grade)\n3. Check anti-backside shields: 15mm behind substrate edges\n4. Check gas flow: MFC calibration, gas line leaks\n\n**Burn-in Procedure (after cleaning):**\n1. Remove substrate\n2. Evacuate to <3×10⁻² mbar\n3. Start at 2kW\n4. Increment 0.5-1kW steps\n5. Wait several minutes between increments\n\n**Control Modes:**\n• Pressure mode (preferred) — auto-adjusts gas flow\n• Flow mode — fixed gas rate\n\n**Safety:** O₂ lines — NEVER use PTFE tape! Only Cobas Green Oxygen tape!'},

// ── ALBOND/ALOX ──
{k:'albond alubond alox aluminium oxide reactive process एल्बॉन्ड एलॉक्स',a:'**AlBond/AlOx Process:**\n\n**Extra Steps vs Standard Al:**\n• O₂/Ar gas flow via MFCs\n• Pre-gas target: 0.3 OD higher than standard\n• Slower VV10C venting\n• Shield temperature monitoring (<250°C)\n\n**AlOx Waste Handling (CRITICAL!):**\n• Store in sealed steel drums\n• 6mm vent hole required (gas buildup!)\n• Max 1/3 full only\n• Label clearly\n• Store outside, away from ignition sources\n• **NEVER mix Al and AlOx waste!**\n\n**PPE (Extra):**\n• Flame-retardant overalls (ISO 14116:2008)\n• Respirator (EN 149:2001)\n• Beryllium copper spark-proof scrapers ONLY\n• NEVER steel tools with AlOx!\n\n**Fire Risk:** AlOx dust is combustible — Nilfisk CFM industrial vacuum only!'},

// ── PM SCHEDULE ──
{k:'pm schedule preventive maintenance daily weekly monthly quarterly annual मेंटेनेंस अनुसूची',a:'**PM Schedule — BOBST K5 Expert:**\n\n**Daily/Every Cycle:**\n• Clean source area, check wire levels\n• Clean evaporators, check O-rings\n• Vacuum level & pump performance check\n• Gas wedge valve operation check\n• Leadthrough gravity oil bottles check\n\n**Weekly:**\n• Source box clean to bare metal\n• Copper posts/blocks clean\n• All shielding clean\n• All rollers clean\n• Viewing windows clean\n• Plasma electrodes clean\n• Kickert rubber sleeve + motor check\n• Wire feeder clamp/guide tube check\n• Inline monitor cables/lenses check\n\n**Monthly:**\n• Wire feeder drive wheel turn/clean\n• Inline monitor calibrate\n• Motor fans clean\n• MFC solenoids/cables check\n\n**Quarterly:**\n• Coating shield cylinder/guide rails clean\n• Shutter gearbox breather clean\n• Encoder check\n• Inline monitor bolts check\n\n**Annual:**\n• Gearbox oil replace\n• Lifting cables inspect\n• Motor bearings check\n• Inline monitor filter replace'},

// ── CLEANING ──
{k:'cleaning सफाई क्लीनिंग ppe safety drum roller',a:'**Cleaning Procedures:**\n\n**PPE Required:**\n• Safety goggles (ANSI Z87.1)\n• Gloves (rubber for caustic)\n• Respirator (EN 149:2001)\n• Flame-retardant overalls (ISO 14116:2008)\n• Safety boots\n\n**Tools:**\n• Flat scrapers\n• Beryllium copper blade scrapers (AlOx — spark-proof)\n• NEVER steel tools on chrome rollers!\n• Nilfisk CFM industrial vacuum (combustible dust rated)\n\n**Drum Cleaning:** Caustic soda — rubber gloves mandatory!\n**Viewing Window:** Razor blade scraper या weak caustic. NEVER solvents/acids!\n**Cryo Coils:** Lint-free cloth only — no abrasives (thin wall)\n\n**Vacuum Cleaner:** Empty after EVERY cycle\n**AlOx waste:** Separate sealed drums, labeled, 6mm vent hole'},

// ── OPERATIONAL SEQUENCES ──
{k:'startup sequence शुरू करना operation standard metallizing process',a:'**Standard Al Metallizing — Full Sequence:**\n\n1. **Load rolls** — shaft insert, chuck engage\n2. **Thread web** — motorized T-belt threader\n3. **Set recipe** — load from Favorites/All\n4. **Pump down** — Cobra → Aerzen → DP → Cryo\n5. **Heat boats** — NEW/OLD warmup\n6. **Wire ON** — stepper motors start feeding\n7. **Shutter OPEN** — at set % of line speed (min 120 m/min)\n8. **Run in Auto OD** — Hawkeye monitors, PLC adjusts\n9. **Shutter CLOSE** — end of roll\n10. **Wire OFF** → **Boats OFF**\n11. **Vent** — VV10A first, VV10B at ~400 mbar\n12. **Unload** — finished met roll out'},

{k:'e-stop emergency stop ई-स्टॉप इमरजेंसी',a:'**E-Stop (Emergency Stop):**\n\n**What it does:** Removes ALL power to:\n• Drives\n• Rotating equipment\n• Evaporation system\n\n**Reset:** E05 panel — flashing button press करो\n\n**G-Stop (Guard Stop):**\n• Removes power to drives, traverse, shutter pneumatics\n• Triggered by traverse isolator OFF\n• Reset via E05 panel\n\n⚠️ E-Stop = total shutdown। G-Stop = partial (guard-related) shutdown।\nE-Stop कभी भी use करो अगर danger feel हो — hesitate मत करो!'},

{k:'shutdown sequence शटडाउन बंद करना end',a:'**Shutdown Sequence:**\n\n1. Vacuum HMI पर **Shutdown** button press करो\n2. 30-50 min automatic sequence starts\n3. Partial pump to ~500 mbar first\n4. Then full shutdown\n5. Cooling water बंद मत करो जब तक DP oil ठंडा न हो!\n\n⚠️ Never just switch off mains — always use HMI shutdown!'},

{k:'inch function इंच slow drum movement',a:'**Inch Function (Slow Drum Movement):**\n\n1. 5-second warning delay (buzzer sounds)\n2. Hold button 3 seconds\n3. Release 1 second\n4. Press again — drum inches at slow speed\n\nUsed for: Threading, inspection, cleaning drum while stationary'},

// ── RECIPES & HMI ──
{k:'recipe रेसिपी hmi screen setup load save',a:'**Recipes System:**\n\n**HMI Screens:** MONITORING, RECIPES, CONFIGURATION, DIAGNOSTICS, REPORTS, DRIVES\n\n**Recipe Parameters:**\n• Web: type/density/thickness/width\n• Source: process type, wire speed\n• Shutter: open/close % of line speed\n• Drum temp, gas wedge flows\n• Winding: tensions/directions/gains\n• Deposit: targets/alarms\n• Plasma settings\n\n**Operations:**\n• **Favorites** (max 9) — quick access\n• **SAVE LIVE** — saves current running parameters\n• **LOAD TO MACHINE** — downloads recipe to PLC\n• BOBST-created recipes cannot be deleted\n\n**Login:** Operator 1/Operator 1, Operator 2/Operator 2, Operator 3/Operator 3\n**USB:** Keyboard/mouse port on E0_5 panel'},

// ── PNEUMATICS (FESTO) ──
{k:'festo cylinder pneumatic speed slow fast valve सिलेंडर न्यूमैटिक वाल्व',a:'**Festo Pneumatics — Cylinder Speed Adjustment:**\n\n**Flow Control Valves (One-Way):**\n• Meter-out = control exhaust air = smooth cylinder movement\n• Turn screw: clockwise = slower, counter-clockwise = faster\n\n**Cylinder Types:** DSBC standard double-acting\n• Used on: Shutter, coating shield, pneumatic actuators\n\n**FRL (Filter-Regulator-Lubricator):**\n• Air pressure: typically 4-6 bar\n• Check filter bowl — drain water regularly\n• Lubricator: only if required by equipment\n\n**ASi Valve Terminals:** Bus-connected solenoid valve islands controlled by PLC via AS-Interface\n\n⚠️ Compressed air में water/oil = valve damage। FRL regularly check करो!'},

// ── IFM SENSORS ──
{k:'ifm sensor flow temperature proximity switch सेंसर फ्लो टेम्परेचर',a:'**IFM Sensors on BOBST K5:**\n\n**Flow Sensors (SM6004):**\n• Magnetic-inductive — cooling water monitoring\n• Alarm output if flow drops below setpoint\n\n**Temperature Sensors:**\n• PT100 (TT1250) — precise process monitoring\n• TN2531 — thermocouple type\n\n**Proximity Switches:**\n• Inductive — metal detection (chuck position, shutter, door)\n• Al dust contamination = false readings → clean regularly!\n\n**Level Sensors (LMT):**\n• Coolant tank level monitoring\n\n**AS-Interface (ASi) Network:**\n• Yellow flat cable — 2-wire bus\n• Master: AC5000/AC5020 (Profibus gateway)\n• Power: AC1218/AC1258 (24V, 8A)\n• Simple sensor/actuator connection system'},

// ── BEARINGS (SKF) ──
{k:'bearing बेयरिंग skf replacement lubrication ग्रीस grease',a:'**SKF Bearings & Lubrication:**\n\n**Types on BOBST K5:**\n• Deep groove ball (6200/6300) — standard rollers\n• CARB toroidal — self-aligning, misalignment compensation\n• Spherical roller — heavy load applications\n• Cam followers — guide roller tracks\n\n**Lubrication Greases (from BOBST manual):**\n• Type A — general bearings\n• Type C — O-rings, seals, vacuum\n• Type F — electrical connections\n• Type I — Deublin rotary unions\n\n**Lubrication Oils:**\n• Anderol 555 — Busch/Aerzen pumps\n• CVC Silicone 4 — diffusion pumps (4.7L capacity)\n• BML HYD10 — non-cooled leadthroughs\n• Castrol Hyspin AWS 10 — cooled drum/DTR1 leadthroughs\n\n⚠️ Wrong grease in vacuum seal = leak! Always use Type C for vacuum O-rings!'},

// ── PLC & AUTOMATION ──
{k:'plc b&r x20 automation studio programming बी एंड आर',a:'**B&R X20 PLC System:**\n\n**Components:**\n• CPU: X20CPx48x processor module\n• Bus Controller: X20BC0083 etc.\n• IO Modules: Digital/Analog\n• Interface: X20IF1063 Profibus DP master\n\n**Storage:** CompactFlash cards — backup important!\n**Software:** Automation Studio for programming\n\n**Troubleshooting:**\n• CPU LED green = running, red = fault, off = no power\n• Module LED: green = OK, red = config error\n• CF card formatting: Use B&R format utility only\n\n**X67 Remote IO:** Distributed installations via Powerlink\n\n⚠️ CF card corrupt = machine down! Regular backup लो!'},

{k:'profibus network communication cable connector node प्रोफ़ीबस नेटवर्क',a:'**Profibus DP Network — BOBST K5:**\n\n**Basics:**\n• Protocol: DP (Decentralized Periphery)\n• Speed: up to 12 Mbit/s\n• Cable: Purple sheathed, max 32 nodes per segment\n• Connector: DB9 Sub-D (Fast-Connect available)\n\n**CRITICAL:** Active terminator at BOTH ends of each segment!\n\n**Troubleshooting:**\n1. LED check on node — green=OK, red=fault\n2. Cable connector tight?\n3. Termination resistors present at both ends?\n4. Cable damage? Kink, cut, near high-power cables?\n5. Node address correct? No duplicate?\n6. Power to node OK? (24V check)\n7. GSD file correct in PLC config?\n\n**90% of Profibus failures = cable/connector/termination issues!**\n\n⚠️ Alarm 353-464 = specific node failure। Number = node ID!'},

{k:'siemens et200 distributed io profibus remote',a:'**Siemens ET200 Distributed IO:**\n\n**ET200M:** Modular rack-based system on Profibus DP\n• Standard signal modules (DI, DO, AI, AO)\n• For larger IO requirements\n\n**ET200S:** Compact modular system\n• Smaller modules, higher density\n• Power modules, motor starters built-in\n\n**Use:** Remote IO racks near drives, pumps, sensors — reduces cable runs\n\n**Troubleshooting:**\n• BF LED (Bus Fault) red = Profibus communication lost\n• SF LED (System Fault) = module config error\n• Check: Profibus cable, termination, node address, GSD file'},

// ── SAFETY ──
{k:'safety relay e-stop guard door interlock सेफ्टी रिले',a:'**Safety Equipment on BOBST K5:**\n\n**Safety Relays (Siemens 3TK28xx):**\n• 3TK2822/2823 — Dual-channel E-stop monitoring\n• 3TK2827/2828 — Expansion modules\n• 3TK2834 — Two-hand control\n\n**Door Interlocks:**\n• Siemens 3SE6604/3SE6704 — Magnetic switches\n• Chamber doors, access panels\n• Guard = open → G-Stop activated\n\n**Viewing Windows:** Hygard BR 750 polycarbonate laminate\n\n**Alarms:** Klaxon beacon (visual) + Roshni sounder (audible)\n\n⚠️ NEVER bypass safety interlocks! LOTO always before maintenance!'},

// ── LUBRICATION ──
{k:'lubrication oil grease type schedule ल्यूब तेल ग्रीस',a:'**Lubrication Schedule & Types:**\n\n**Greases:**\n• Type A — General purpose bearings\n• Type C — O-rings, seals, vacuum applications\n• Type F — Electrical connections (anti-seize)\n• Type I — Deublin rotary unions\n• Rocol J166 — Copper contact block bolts (anti-seize)\n• Molykote G-n plus — ETP Express clamping hub\n\n**Oils:**\n• **Anderol 555** — Busch Cobra & Aerzen pumps\n• **CVC Silicone 4** — Diffusion pumps (4.7L)\n• **BML HYD10** — Non-cooled leadthroughs\n• **Castrol Hyspin AWS 10** — Cooled drum/DTR1 leadthroughs\n\n**Schedule:**\n• Daily: Check leadthrough gravity oil bottles\n• Weekly: Check shaft for leaks\n• Bi-annual: Check bearing play\n\n⚠️ Mixing oil types = pump damage! Always use specified oil only!'},

// ── MFC / GAS ──
{k:'mfc mass flow controller gas argon oxygen nitrogen एमएफसी गैस',a:'**MKS 1179A/2179A Mass Flow Controller (MFC):**\n\n**Function:** Precisely controls gas flow for plasma treater & AlBond\n**Gases:** Argon, Oxygen, Nitrogen (individual calibration per gas)\n\n**Control:**\n• Command: 0-5V analog input\n• Output: 0-5V proportional to actual flow\n• Ranges: Various sccm/slm\n\n**Safety:** Normally-closed valve — gas STOPS on power failure!\n\n**Calibration:**\n• Zero: With no flow, adjust zero pot\n• Span: Factory set, don\'t adjust unless trained\n\n**Maintenance:**\n• Monthly: Check solenoids/cables\n• Bi-annual: Clean inlet filters with acetone\n• Check for blockages (1mm drill for gas wedge nozzles)\n\n**Plasma Treater Gas Mix:**\n• Standard: Pure Ar or N₂\n• Enhanced: 80% Ar / 20% O₂ mix\n• Pressure: 4×10⁻² to 8×10⁻² mbar in treater'},

// ── GENERAL ──
{k:'sap entry production order एसएपी प्रोडक्शन ऑर्डर',a:'**SAP Entry (Met Jumbo Entry):**\n\nSAP में Production Entry करने के लिए WI-26 follow करो:\n• Production Order Number नोट करो\n• Material Code, Grade, Roll ID enter करो\n• Grade codes: 2=OK/A, 3=B-grade, 5=Salvageable, 6=Offcut/Waste\n\n**Export:** Max 1 joint per slit roll\n**Domestic:** Max 2 joints per slit roll'},

{k:'hello hi नमस्ते hey greet',a:'**नमस्ते! 🙏 मैं MetTrain AI Expert हूँ!**\n\nमुझसे BOBST K5 Expert मशीन और सभी equipment के बारे में कुछ भी पूछो:\n\n• Vacuum system (Cobra, Aerzen, Diffusion pump)\n• Evaporation (boats, wire feeders, Thyro-A)\n• Winding & tension (drives, spreader)\n• Alarms & troubleshooting (312-464)\n• PM schedule & cleaning\n• Chiller system\n• Plasma treater\n• AlBond/AlOx process\n• Drives (ATV71, G120C, Unidrive SP)\n• Profibus network\n• IFM sensors, Festo pneumatics\n\n📚 250+ OEM manuals का ज्ञान — बिल्कुल FREE! 🆓'},

{k:'thanks thank you dhanyavaad धन्यवाद शुक्रिया',a:'**आपका स्वागत है! 🙏**\n\nकोई और सवाल हो तो बेझिझक पूछो। मैं 24/7 उपलब्ध हूँ — और बिल्कुल FREE! 😊'},

{k:'who are you कौन हो तुम what can you do',a:'**मैं MetTrain AI Expert हूँ! 🤖**\n\nमेरे पास है:\n• BOBST K5 Expert OEM manual (719 pages) का पूरा ज्ञान\n• 250+ auxiliary equipment manuals (Cobra pump, Aerzen, Thyro-A, MKS gauges, Stögra, ATV71, G120C, Unidrive SP, B&R PLC, Siemens ET200, IFM sensors, Festo, SKF bearings, Profibus...)\n• Metalliser Plant SOPs & WIs\n• Alarm codes & troubleshooting\n• PM schedules\n\n**और ये सब FREE है — कोई API cost नहीं!** 🆓\n\nबस अपना सवाल पूछो Hindi/English/Hinglish में!'}
];

// ── SMART FUZZY SEARCH ENGINE ──
function searchQA(query){
  var q=query.toLowerCase().replace(/[?।,\.!'":\-()]/g,' ').replace(/\s+/g,' ').trim();
  // Spelling normalization (British↔American, common misspellings)
  q=q.replace(/metallisation/g,'metallization').replace(/aluminium/g,'aluminum')
     .replace(/colour/g,'color').replace(/vapour/g,'vapor').replace(/centre/g,'center')
     .replace(/analyse/g,'analyze').replace(/organise/g,'organize')
     .replace(/vaccum/g,'vacuum').replace(/vacume/g,'vacuum').replace(/vaccume/g,'vacuum')
     .replace(/temprature/g,'temperature').replace(/maintainance/g,'maintenance')
     .replace(/touble/g,'trouble').replace(/machne/g,'machine').replace(/presure/g,'pressure')
     .replace(/alubond/g,'albond').replace(/aluoxide/g,'alox').replace(/aluminium oxide/g,'alox')
     .replace(/diffusion pump/g,'diffusion pump dp').replace(/fark/g,'difference')
     .replace(/antar/g,'difference').replace(/comparison/g,'difference vs compare');
  // Hindi → English expansion (comprehensive)
  var hiMap={
    'वैक्युम':'vacuum pump pumpdown','पम्प':'pump cobra aerzen diffusion roughing','बोट':'boat ceramic evaporation warmup',
    'वायर':'wire feeder stogra stepper','टेंशन':'tension dancer load cell winding unwinding',
    'अलार्म':'alarm fault error code trip','क्लीनिंग':'cleaning maintenance','रोल':'roll jumbo winding',
    'ड्रम':'drum chill cooling','प्लाज़्मा':'plasma treater corona treatment',
    'प्रेशर':'pressure vacuum gauge','तापमान':'temperature sensor thermal','पानी':'water cooling chiller glycol',
    'तेल':'oil lubrication grease','ग्रीस':'grease lubrication skf bearing','चिलर':'chiller gre heater cooler glycol',
    'स्पीड':'speed frequency drive motor','वाइंडिंग':'winding rewind unwind tension dancer',
    'रिवाइंड':'rewind winding','अनवाइंड':'unwind unwinding','एवैपोरेशन':'evaporation boat source',
    'डिफ्यूज़न':'diffusion pump varian oil','क्रायोजेनिक':'cryogenic polycold coil cryo',
    'स्प्रेडर':'spreader kickert bow roller wrinkle','थ्रेडर':'threader threading film web',
    'कॉपर':'copper contact block boat','मेंटेनेंस':'maintenance pm schedule preventive daily weekly monthly',
    'ड्राइव':'drive vfd inverter atv71 g120c unidrive motor','इन्वर्टर':'inverter vfd drive atv71 g120c sinamics',
    'कोबरा':'cobra busch pump screw nc630 dry','एरज़ेन':'aerzen roots booster mechanical gm2000',
    'बेयरिंग':'bearing skf deep groove carb spherical lubrication','सेंसर':'sensor ifm flow temperature proximity pressure',
    'सिलेंडर':'cylinder festo pneumatic','वाल्व':'valve solenoid festo pneumatic bray',
    'रिले':'relay safety siemens omron wago','एनकोडर':'encoder rotary sick atm60 speed position',
    'बरैट्रॉन':'baratron mks 627b capacitance manometer','पिरानी':'pirani mks 925 micropirani gauge thermal',
    'थायरिस्टर':'thyristor thyro-a power controller ae advanced energy','स्टेपर':'stepper stogra sers motor wire feeder',
    'शाफ़्ट':'shaft svecom expanding mechanical winding','कपलिंग':'coupling etp express flexible ktr radex ruland',
    'प्रोफ़ीबस':'profibus dp node cable termination bus fault','प्रोफिनेट':'profinet ethernet network',
    'शटडाउन':'shutdown sequence vent cool','स्टार्टअप':'startup sequence pumpdown warmup',
    'हॉकआई':'hawkeye od control optical inline monitor','ओडी':'od optical density hawkeye coating thickness',
    'लीक':'leak vacuum pressure rise test helium seal','पंपडाउन':'pumpdown vacuum sequence start pump',
    'वेंट':'vent venting sequence chamber atmospheric','ई-स्टॉप':'e-stop emergency stop safety',
    'एल्बॉन्ड':'albond alubond reactive aluminium oxygen alox',
    'एलॉक्स':'alox reactive aluminum oxide waste','सफाई':'cleaning maintenance dust',
    'सुरक्षा':'safety ppe interlock guard','रेसिपी':'recipe hmi parameter setting film',
    'फॉल्ट':'fault error alarm trip code','एरर':'error fault alarm trip',
    'ट्रिप':'trip fault error code','ओवरलोड':'overload overcurrent motor',
    'ओवरहीट':'overheat overtemperature thermal','फ्लो':'flow sensor ifm sm6004 kobold meter',
    'स्ट्रेनर':'strainer filter glycol tower','कंप्रेसर':'compressor scroll chiller refrigeration',
    'ग्लाइकॉल':'glycol ethylene coolant antifreeze chiller','रेफ्रिजरेंट':'refrigerant r404a chiller compressor',
    'डीआईपी':'dip switch s1 thyro configuration','एलईडी':'led indicator status fault green red',
    'पीएलसी':'plc b&r x20 siemens et200 controller','एचएमआई':'hmi touchscreen elo operator panel',
    'ओ-रिंग':'o-ring seal door vacuum chamber','गैसकेट':'gasket seal door flange',
    'फिल्म':'film substrate pet bopp cpp metallized','सब्सट्रेट':'substrate film material pet bopp nylon',
    'कोटिंग':'coating metallization aluminum deposit layer','वेस्ट':'waste scrap trim b-grade',
    'स्लिटिंग':'slitting blade knife cut','ब्लेड':'blade knife slitting lutz',
    'कोर':'core winding id 3 6 8 inch','स्प्लाइस':'splice joint tape film',
    'पीएम':'pm preventive maintenance schedule daily weekly monthly quarterly',
    'डेली':'daily maintenance check routine','वीकली':'weekly maintenance check schedule',
    'मंथली':'monthly maintenance check schedule','क्वार्टरली':'quarterly maintenance check schedule',
    'एसएपी':'sap entry production cor1 zpp','बी-ग्रेड':'b-grade quality defect reject',
    'पिनहोल':'pinhole defect hole film coating','खरोंच':'scratch defect film damage',
    'झुर्री':'wrinkle crease film web spreader','एज':'edge trim curl film web',
    'पावर':'power supply psu murr meanwell 24v','सर्किट':'circuit breaker mcb protection siemens',
    'कनेक्टर':'connector harting plug socket cable','स्विच':'switch safety door limit magnetic',
    'नेटवर्क':'network profibus profinet ethernet switch harting','केबल':'cable profibus ethernet power signal'
  };
  // Roman Hindi (Hinglish) — what operators actually type!
  var roMap={
    'garam':'overheating overheat temperature hot thermal bearing motor pump','thanda':'cooling chiller cold chill drum temperature',
    'awaaz':'noise vibration bearing motor pump sound','kharab':'fault error broken damaged failure problem',
    'chalu':'start startup run running power on','band':'stop shutdown off power down stopped',
    'nahi':'not problem fault error troubleshoot','ruk':'stop stopped halt trip fault','toota':'broken web break film tear damage',
    'sukhha':'dry lubrication oil grease bearing no coolant','geela':'wet moisture condensation water leak',
    'tel':'oil lubrication grease diffusion pump bearing','grease':'grease lubrication bearing skf maintenance',
    'safai':'cleaning clean maintenance chamber roller','saaf':'cleaning clean wipe ipa roller',
    'badle':'replace change swap new part spare','badalna':'replace change swap maintenance',
    'check':'check inspection verify test measure','kaise':'how procedure step method guide',
    'kya':'what','matlab':'meaning','samajh':'understand','kaise':'how procedure',
    'pehle':'first start begin sequence','naya':'new fresh trainee beginner','seekhe':'learn training roadmap',
    'seekhna':'learn training','sikhe':'learn training',
    'bijli':'electricity power supply voltage current electrical','light':'power supply electricity voltage',
    'dhuan':'smoke fire overheating burning alarm emergency','steam':'vapor steam moisture condensation hot leak',
    'smell':'burning smoke overheating electrical fire','vibration':'vibration noise bearing motor alignment coupling',
    'patla':'thin low od coating thickness deposit','mota':'thick high od coating excess wire feed',
    'zyada':'high excess over more too much maximum','kam':'low less insufficient minimum shortage',
    'tez':'fast high speed quick rapid','dheema':'slow low speed sluggish',
    'dheela':'loose slack low tension coupling bolt connection','tight':'tight high tension over-torque excessive',
    'leak':'leak leaking seal o-ring vacuum pressure water glycol','tapak':'drip leak water glycol coolant condensation',
    'jhurri':'wrinkle crease fold mark film web spreader tension','sidha':'straight aligned alignment tracking edge',
    'tedha':'crooked misaligned bent tracking deviation','ulta':'reverse wrong incorrect opposite direction',
    'pura':'complete full total entire finished done','aadha':'partial half incomplete partially',
    'purana':'old worn used end-of-life replace','naya':'new fresh replacement spare',
    'upar':'up upper top high above over','neeche':'down lower bottom below under',
    'andar':'inside internal inner chamber within','bahar':'outside external outer ambient',
    'khula':'open opened door valve chamber vent','band':'closed shut sealed locked door valve',
    'ganda':'dirty contaminated unclean dust particle','saaf':'clean clear pure uncontaminated',
    'pani':'water cooling chiller glycol leak condensation tower','hawa':'air compressed pneumatic pressure leak supply',
    'aag':'fire burning flame smoke emergency extinguisher','dhool':'dust particle contamination cleaning filter',
    'roll':'roll jumbo rewind unwind winding core shaft','film':'film web substrate plastic pet bopp cpp nylon',
    'taar':'wire cable aluminum connection electrical','nut':'nut bolt fastener tighten loose torque',
    'bolt':'bolt nut fastener tighten loose torque','pipe':'pipe tube fitting connection flange',
    'switch':'switch button breaker isolator limit safety','button':'button switch press e-stop pushbutton',
    'screen':'screen hmi display monitor touchscreen panel alarm','display':'display screen hmi monitor readout indicator',
    'setting':'setting parameter recipe value configure adjust','reading':'reading value measurement display gauge sensor',
    'report':'report log entry record production shift daily','entry':'entry sap data production record log',
    'plan':'plan planning production schedule order','order':'order production plan customer specification',
    'sample':'sample quality check test cut inspect od dyne','test':'test check measure verify calibrate inspect',
    'grade':'grade quality a-grade b-grade reject accept 2 3 5 6','reject':'reject b-grade defect waste scrap quality',
    'waste':'waste scrap trim b-grade disposal segregation','salary':'salary career growth promotion path pay',
    'chutti':'leave absence shift schedule holiday','shift':'shift handover changeover rotation schedule',
    'supervisor':'supervisor incharge boss senior report','senior':'senior experienced operator technician',
    'junior':'junior new trainee fresher helper','helper':'helper trainee assistant junior',
    'fuse':'fuse blown replace breaker mcb protection','breaker':'breaker mcb mccb trip fuse protection',
    'trip':'trip fault error alarm drive motor breaker','reset':'reset clear acknowledge fault trip alarm restart',
    'baar':'recurring repeating again repeatedly frequent','jaldi':'quick fast urgent immediately emergency',
    'problem':'problem fault error issue troubleshoot fix','theek':'fix repair correct ok working normal',
    'kaam':'work function running operation operating','chalana':'run operate start machine drive motor',
    'rokna':'stop halt shutdown e-stop machine','dekhna':'check inspect look observe monitor visual'
  };
  Object.keys(roMap).forEach(function(ro){ if(q.indexOf(ro)>=0) q+=' '+roMap[ro]; });
  // English synonym expansion
  var enMap={
    'pump':'vacuum roughing dry screw cobra busch','drive':'vfd inverter motor frequency speed',
    'atv':'atv71 schneider altivar drive','g120':'g120c sinamics siemens drive','unidrive':'sp ct nidec drive',
    'thyro':'thyro-a thyristor power controller ae','cobra':'nc630 busch screw pump dry vacuum',
    'aerzen':'gm2000 roots booster mechanical pump','stogra':'sers stepper motor wire feeder',
    'pirani':'mks 925 micropirani vacuum gauge thermal','baratron':'mks 627b capacitance manometer pressure',
    'chiller':'heater cooler gre glycol compressor scroll','bearing':'skf deep groove carb spherical roller',
    'etp':'express hydraulic shaft hub coupling','profibus':'dp cable termination node bus fault',
    'kickert':'spreader bow roller wrinkle web','svecom':'shaft expanding mechanical winding core',
    'plc':'b&r x20 controller program','et200':'siemens distributed io profibus','festo':'pneumatic cylinder valve frl',
    'ifm':'sensor flow temperature proximity asi','mks':'vacuum gauge pressure baratron pirani',
    'skf':'bearing grease lubrication maintenance','siemens':'g120c et200 circuit breaker plc',
    'schneider':'atv71 altivar 312 drive telemecanique','murr':'elektronik power supply mico psu',
    'harting':'connector ethernet switch socket','rittal':'enclosure cabinet panel cooling',
    'omron':'relay g2r g3r','wago':'relay socket 788','klockner':'moeller isolator switch',
    'alarm':'fault error code trip warning','error':'fault alarm trip code','fault':'error alarm trip code',
    'maintenance':'pm preventive schedule check daily weekly monthly','oil':'lubrication grease bearing diffusion',
    'temperature':'thermal sensor pt100 overtemp','pressure':'vacuum gauge sensor transducer',
    'speed':'frequency motor drive rpm','current':'overcurrent amp motor overload',
    'voltage':'overvoltage undervoltage supply mains','cooling':'chiller water glycol tower drum',
    'winding':'tension dancer load cell rewind unwind','vacuum':'pump pumpdown pressure leak chamber',
    'evaporation':'boat source wire aluminum ceramic','safety':'interlock guard e-stop relay door',
    'web':'film break tension wrinkle threading','roll':'jumbo winding rewind core shaft',
    'parameter':'setting recipe configure value','reset':'clear fault restart','spare':'part replacement component'
  };
  Object.keys(hiMap).forEach(function(hi){ if(q.indexOf(hi)>=0) q+=' '+hiMap[hi]; });
  Object.keys(enMap).forEach(function(en){ if(q.indexOf(en)>=0) q+=' '+enMap[en]; });
  var words=q.split(/\s+/).filter(function(w){return w.length>1;});
  if(words.length===0)return null;
  // Detect original query language (before expansion)
  var _importantShort={'od':1,'dp':1,'hv':1,'pm':1,'rv':1,'bv':1,'ai':1,'ac':1,'dc':1,'5s':1,'ir':1};
  var origWords=query.toLowerCase().replace(/[?।,.!'":\-()]/g,' ').split(/\s+/).filter(function(w){return w.length>2||_importantShort[w];});
  var results=QA_DB.map(function(qa,idx){
    var score=0;var kw=qa.k.toLowerCase();
    // Score using ORIGINAL query words first (higher weight)
    origWords.forEach(function(w){
      var found=false;
      if(w.length<=2){
        // Short words: match as whole word only (prevent "od" matching "code")
        var rx=new RegExp('(^|[\\s\\.\\-_])'+w+'([\\s\\.\\-_]|$)','i');
        found=rx.test(kw);
      } else {
        found=kw.indexOf(w)>=0;
      }
      if(found){
        score+=2;
        if(w.length>4) score+=2;
        if(w.length>7) score+=3;
      }
    });
    // Score using expanded words (lower weight)
    words.forEach(function(w){
      if(kw.indexOf(w)>=0){
        score+=0.5;
        if(w.length>4) score+=0.5;
        if(w.length>7) score+=1;
      }
    });
    // Exact phrase bonus (original query)
    var origPhrase=origWords.slice(0,3).join(' ');
    if(origPhrase.length>5 && kw.indexOf(origPhrase)>=0) score+=8;
    // Model number match bonus
    var modelMatch=q.match(/\b(atv71|g120c?|nc\s?630|sers\s?\d+|sm\d{4}|x20\w+|et200[ms]?|627b|925|3tk\d+|3rv\d+|3rw\d+|mdr.?\d+|1fk7|bm[h]?\d+|etp|lc1f|thyro|unidrive|altivar|cobra|aerzen|kickert|svecom|pirani|baratron|hawkeye|polycold)\b/i);
    if(modelMatch && kw.indexOf(modelMatch[1].toLowerCase())>=0) score+=6;
    // Alarm/fault number match
    var numMatch=q.match(/(\d{3,4})/);
    if(numMatch && kw.indexOf(numMatch[1])>=0) score+=8;
    return {idx:idx,score:score,a:qa.a};
  });
  // Detect if query is in Hindi (contains Devanagari characters)
  var isHindi=/[\u0900-\u097F]/.test(query);
  if(isHindi){
    // Boost entries with Hindi content in answer
    results.forEach(function(r){
      if(/[\u0900-\u097F]/.test(r.a)) r.score+=3;
    });
  }
  results.sort(function(a,b){return b.score-a.score;});
  // Quality threshold: need strong match to return offline answer
  // If API key available, require higher score (let Gemini handle weak matches)
  var apiAvail=_aiAPIKey&&_aiAPIKey.length>10;
  var minScore=apiAvail?5:2.5;
  if(results[0].score>=minScore) return results[0].a;
  // For non-API mode, try lower threshold
  if(!apiAvail && results[0].score>=2) return results[0].a;
  return null;
}


// ═══ SAVE AI RESPONSE AS DOC/XLSX ═══
function saveAsDoc(idx){
  if(idx<0||idx>=_aiHistory.length)return;
  var content=_aiHistory[idx].content;
  var title='MetTrain_AI_Answer';
  // Try to extract title from first bold text
  var tm=content.match(/\*\*(.+?)\*\*/);
  if(tm) title=tm[1].replace(/[^\w\s\-]/g,'').trim().replace(/\s+/g,'_').substring(0,40);
  
  // Convert markdown to HTML
  var h=content;
  h=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  h=h.replace(/^[•\-]\s(.+)$/gm,'<li>$1</li>');
  h=h.replace(/^(\d+)\.\s(.+)$/gm,'<li><b>$1.</b> $2</li>');
  h=h.replace(/→/g,'&#8594;');
  h=h.replace(/⚡/g,'&#9889;');
  h=h.replace(/⚠️/g,'&#9888;');
  h=h.replace(/✅/g,'&#10004;');
  h=h.replace(/❌/g,'&#10006;');
  h=h.replace(/🔴/g,'&#128308;');
  // Tables
  h=h.replace(/\|(.+)\|/gm,function(m,c){
    var cells=c.split('|').map(function(x){return x.trim();});
    if(cells.every(function(x){return /^[-:]+$/.test(x);}))return '';
    return '<tr>'+cells.map(function(x){return '<td style="border:1px solid #000;padding:4pt">'+x+'</td>';}).join('')+'</tr>';
  });
  if(h.indexOf('<tr>')>=0) h='<table style="border-collapse:collapse;width:100%">'+h+'</table>';
  h=h.replace(/\n/g,'<br>');
  
  var doc='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    +'<head><meta charset="utf-8"><style>'
    +'body{font-family:Calibri,sans-serif;font-size:11pt;margin:1in}'
    +'table{border-collapse:collapse;width:100%}'
    +'th,td{border:1px solid #000;padding:4pt 6pt;font-size:10pt}'
    +'th{background:#1B3A5C;color:#fff}'
    +'li{margin:3pt 0}'
    +'</style></head><body>'
    +'<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72pt;color:rgba(200,200,200,0.08);font-weight:900;letter-spacing:10pt;z-index:-1;font-family:Arial">VKS TECH</div>'
    +'<div style="text-align:center;margin-bottom:20pt">'
    +'<div style="font-size:16pt;font-weight:bold;color:#1B3A5C">'+title.replace(/_/g,' ')+'</div>'
    +'<div style="font-size:9pt;color:#888;margin-top:4pt">Generated by VKS TECH — Vacuum Metallisation Knowledge Platform</div>'
    +'</div><hr style="border:1px solid #F0A500">'
    +h
    +'<br><hr style="border:1px solid #ccc"><div style="font-size:8pt;color:#aaa;margin-top:8pt">© VKS TECH | Vacuum Metallisation Knowledge Base | '+new Date().toLocaleDateString()+'</div>'
    +'</body></html>';
  
  var blob=new Blob(['\ufeff'+doc],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=title+'.doc';
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function saveAsXlsx(idx){
  if(typeof XLSX==='undefined'||idx<0||idx>=_aiHistory.length)return;
  var content=_aiHistory[idx].content;
  var title='MetTrain_AI_Data';
  var tm=content.match(/\*\*(.+?)\*\*/);
  if(tm) title=tm[1].replace(/[^\w\s\-]/g,'').trim().replace(/\s+/g,'_').substring(0,40);
  
  var wb=XLSX.utils.book_new();
  var rows=[];
  rows.push([title.replace(/_/g,' ')]);
  rows.push(['© VKS TECH — Vacuum Metallisation Knowledge Base | '+new Date().toLocaleDateString()]);
  rows.push([]);
  
  var lines=content.split('\n');
  for(var i=0;i<lines.length;i++){
    var line=lines[i].replace(/\*\*/g,'').replace(/→/g,'->');
    // Table rows
    if(line.indexOf('|')>=0){
      var cells=line.split('|').map(function(c){return c.trim();}).filter(function(c){return c&&!/^[-:]+$/.test(c);});
      if(cells.length>0) rows.push(cells);
    } else if(line.trim()){
      rows.push([line.trim()]);
    }
  }
  
  var ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:50},{wch:25},{wch:25},{wch:20}];
  XLSX.utils.book_append_sheet(wb,ws,'Data');
  XLSX.writeFile(wb,title+'.xlsx');
}

function _dlBar(idx){
  return '<div class="ai-dl-bar">'
    +'<button class="ai-dl-btn" onclick="saveAsDoc('+idx+')">📄 Save as Doc</button>'
    +'<button class="ai-dl-btn" onclick="saveAsXlsx('+idx+')">📊 Save as Excel</button>'
    +'</div>';
}


function askAI(quickQ){
  // Check for budget download triggers
  if(quickQ && (quickQ.toLowerCase().includes('download budget') || quickQ.toLowerCase().includes('budget file') || quickQ.toLowerCase().includes('document file'))){
    var msgs=document.getElementById('ai-msgs');
    _aiHistory.push({role:'user',content:quickQ});
    if(msgs){
      msgs.innerHTML+='<div class="ai-msg ai-user"><div class="ai-bubble ai-bubble-user">'+escH(quickQ)+'</div></div>';
      msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot"><b>📥 Budget Templates Download करो:</b><br><br>नीचे दो format available हैं — button दबाओ → Direct Excel (.xlsx) file download होगी!<br><br><button onclick="downloadBudget(\'simple\')" style="background:#4CAF50;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;margin:4px">📥 Simple Format (11 Categories)</button><br><button onclick="downloadBudget(\'detailed\')" style="background:#2196F3;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;margin:4px">📥 Detailed Format (10 Sheets)</button><br><br><small style="color:#888">💡 Direct .xlsx format — Excel/Google Sheets में directly खुलेगी!</small></div></div>';
      msgs.scrollTop=msgs.scrollHeight;
    }
    return;
  }
  if(_aiLoading)return;
  var inp=document.getElementById('ai-inp');
  var q=quickQ||(inp?inp.value.trim():'');
  if(!q)return;
  if(inp)inp.value='';

  // Add user message to history
  _aiHistory.push({role:'user',content:q});

  // Render user message
  var msgs=document.getElementById('ai-msgs');
  if(msgs){
    msgs.innerHTML+='<div class="ai-msg ai-user"><div class="ai-bubble ai-bubble-user">'+escH(q)+'</div></div>';
    msgs.scrollTop=msgs.scrollHeight;
  }

  // ★ STEP 1: Try FREE offline Q&A engine first
  var localAnswer=searchQA(q);
  if(localAnswer){
    // Found answer locally — FREE, instant, no API needed!
    localAnswer+='\n\n🆓 *Offline Knowledge Base — No API Cost*';
    _aiHistory.push({role:'assistant',content:localAnswer});
    if(msgs){
      msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">'+formatAIReply(localAnswer)+_detectFmt(localAnswer,q)+_dlBar(_aiHistory.length-1)+'</div></div>';
      msgs.scrollTop=msgs.scrollHeight;
    }
    return;
  }

  // ★ STEP 2: No local match — try API if key available
  var hasKey=_aiAPIKey&&_aiAPIKey.length>10;
  if(!hasKey){
    // No API key and no local match — give helpful response
    var fallback='🤔 इस specific सवाल का जवाब मेरे offline knowledge base में नहीं मिला।\n\n**Try करो:**\n• अलग शब्दों में पूछो (Hindi या English)\n• Quick question chips use करो ↑\n• Specific topic पूछो: vacuum, boat, alarm code, tension, drive, chiller, etc.\n\n📚 मेरे पास 592 pre-built expert answers हैं!\n\n💡 **AI Mode:** ⚙️ बटन दबाओ → Free Gemini API key add करो → कोई भी सवाल का intelligent answer!\n🔗 Free key: aistudio.google.com/apikey';
    _aiHistory.push({role:'assistant',content:fallback});
    if(msgs){
      msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">'+formatAIReply(fallback)+'</div></div>';
      msgs.scrollTop=msgs.scrollHeight;
    }
    return;
  }

  // ★ STEP 3: API available — check daily limit first
  if(!_checkDailyLimit()){
    var limitMsg='⏳ आज की API limit ('+_AI_DAILY_LIMIT+' calls) पूरी हो गई।\n\nकल reset होगी। अभी offline answers use करो (592 entries)।\n\n💡 Gemini Free tier: 15 requests/minute, ~1500/day available';
    _aiHistory.push({role:'assistant',content:limitMsg});
    if(msgs){
      msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">'+formatAIReply(limitMsg)+'</div></div>';
      msgs.scrollTop=msgs.scrollHeight;
    }
    return;
  }
  _incrementCallCount();

  // Full Gemini AI for complex/custom questions
  if(msgs){
    msgs.innerHTML+='<div class="ai-msg ai-bot" id="ai-loading"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot"><div id="ai-status" style="font-size:11px;color:#8b5cf6;margin-bottom:4px">📖 Manual खोज रहा है...</div><div class="ai-typing"><span></span><span></span><span></span></div></div></div>';
    msgs.scrollTop=msgs.scrollHeight;
  }

  _aiLoading=true;
  var sendBtn=document.getElementById('ai-send-btn');
  if(sendBtn)sendBtn.disabled=true;

  // Step 1: Find & fetch relevant PDF context
  var pdfMatches=findRelevantPDFs(q);
  var pdfPromise;
  if(pdfMatches.length>0){
    // Update status
    var statusEl=document.getElementById('ai-status');
    if(statusEl){
      var fnames=pdfMatches.map(function(m){return m.f.replace('.pdf','');}).join(', ');
      statusEl.innerHTML='📖 Reading: <b>'+fnames+'</b>...';
    }
    pdfPromise=fetchPDFContext(q);
  } else {
    pdfPromise=Promise.resolve('');
  }

  pdfPromise.then(function(pdfContext){
    // Update status
    var statusEl=document.getElementById('ai-status');
    if(statusEl){
      if(pdfContext.length>100){
        statusEl.innerHTML='✅ Manual data loaded • 🤖 Gemini AI सोच रहा है...';
      } else {
        statusEl.innerHTML='🤖 Gemini AI सोच रहा है...';
      }
    }

    // Step 2: Build messages for Gemini API
    var geminiContents=[];
    var startIdx=Math.max(0,_aiHistory.length-16);
    for(var i=startIdx;i<_aiHistory.length;i++){
      geminiContents.push({
        role:_aiHistory[i].role==='assistant'?'model':'user',
        parts:[{text:_aiHistory[i].content}]
      });
    }

    // If we have PDF context, inject it into the last user message
    if(pdfContext.length>100){
      var lastMsg=geminiContents[geminiContents.length-1];
      lastMsg.parts[0].text=lastMsg.parts[0].text+'\n\n[REFERENCE DATA from OEM manuals — use this to give detailed, accurate answer with specific values, procedures, part numbers:]\n'+pdfContext;
    }

    // Step 3: Call Google Gemini API
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(_aiAPIKey),{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        system_instruction:{parts:[{text:AI_SYS_PROMPT}]},
        contents:geminiContents,
        generationConfig:{
          maxOutputTokens:2000,
          temperature:0.7
        }
      })
    });
  })
  .then(function(r){return r.json();})
  .then(function(data){
    _aiLoading=false;
    if(sendBtn)sendBtn.disabled=false;

    var reply='';
    if(data.candidates&&data.candidates.length>0&&data.candidates[0].content){
      reply=data.candidates[0].content.parts.map(function(p){return p.text||'';}).join('');
    } else if(data.error){
      reply='❌ Error: '+(data.error.message||'API error');
      if(data.error.code===400){
        reply='❌ Invalid API Key या request error. कृपया सही Gemini key दर्ज करें। ⚙️ बटन से key बदलें।\n\nFree key: aistudio.google.com/apikey';
      } else if(data.error.code===403){
        reply='❌ API Key invalid या disabled. कृपया aistudio.google.com/apikey से नई key बनाओ।';
      } else if(data.error.code===429){
        reply='⏳ Rate limit — कुछ सेकंड wait करो फिर try करो।';
      }
    } else {
      reply='❌ कुछ गड़बड़ हुई, फिर से कोशिश करें।';
    }

    // If PDF was used, add source indicator
    if(pdfMatches.length>0 && reply.indexOf('❌')!==0){
      var srcs=pdfMatches.map(function(m){return m.f.replace('.pdf','').replace(/_/g,' ');}).join(', ');
      reply+='\n\n📖 *Source: '+srcs+'*';
    }

    // Save to history (without PDF injection text)
    _aiHistory.push({role:'assistant',content:reply});

    // Remove loading and add reply
    var loadEl=document.getElementById('ai-loading');
    if(loadEl)loadEl.remove();

    if(msgs){
      msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">'+formatAIReply(reply)+_detectFmt(reply,q)+_dlBar(_aiHistory.length-1)+'</div></div>';
      msgs.scrollTop=msgs.scrollHeight;
    }
  })
  .catch(function(err){
    _aiLoading=false;
    if(sendBtn)sendBtn.disabled=false;
    var loadEl=document.getElementById('ai-loading');
    if(loadEl)loadEl.remove();
    if(msgs){
      msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">🤖</div><div class="ai-bubble ai-bubble-bot">❌ Network error: '+escH(err.message)+'. कृपया internet connection चेक करें।</div></div>';
      msgs.scrollTop=msgs.scrollHeight;
    }
  });
}

// renderMobNav + nav/mode patches (boot runs after all modules load)
function renderMobNav(){
  // Hide mob nav on landing page
  var el=document.getElementById('mob-nav');
  if(CUR==='landing'){if(el)el.innerHTML='';return;}
  var g=MODE==='free';
  var items=[
    {id:'home',ico:'🏠',l:'होम'},
    {id:'defect',ico:'🔴',l:'Defects'},
    {id:'askai',ico:'🤖',l:'AI Expert'},
    {id:'met',ico:'⚡',l:'मेट'},
    {id:'slit',ico:'✂️',l:'स्लिटर'},
    {id:'safety',ico:'🦺',l:'सुरक्षा'},
    {id:'sops',ico:'📋',l:'SOPs'},
    'sep',
    {id:'genmet',ico:'🔥',l:'धाकड़ मेट'},
    {id:'genslit',ico:'🔧',l:'धाकड़ स्लिट'},
    {id:'terms',ico:'📚',l:'शब्दावली'},
    'sep',
    {id:'manuals',ico:'📖',l:'OEM Manual'},
    {id:'quiz',ico:'📝',l:'परीक्षा'},
    {id:'check',ico:'✅',l:'चेकलिस्ट'},
  ];
  if(g){
    items.splice(5,0,{id:'sap',ico:'💻',l:'SAP'},{id:'maint',ico:'🛠️',l:'PM'});
  }
  var h='';
  items.forEach(function(it){
    if(it==='sep'){h+='<div class="mnb-sep"></div>';return;}
    h+='<div class="mnb'+(CUR===it.id?' on':'')+'" onclick="nav(\''+it.id+'\')">'
      +'<span class="mnb-ico">'+it.ico+'</span>'
      +'<span class="mnb-lbl">'+it.l+'</span></div>';
  });
  var el=document.getElementById('mob-nav');
  if(el)el.innerHTML=h;
}

// Patch nav to also update mob nav
var _navOrig=nav;
nav=function(id){
  _navOrig(id);
  renderMobNav();
  // Scroll active mob nav item into view
  setTimeout(function(){
    var el=document.getElementById('mob-nav');
    if(!el)return;
    var on=el.querySelector('.mnb.on');
    if(on)on.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
  },50);
};

// Re-render mob nav when mode changes
var _setModeOrig=setMode;
setMode=function(m){_setModeOrig(m);renderMobNav();};

