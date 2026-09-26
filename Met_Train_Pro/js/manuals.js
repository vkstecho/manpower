// Met Train PRO — OEM Manual Library
var MANUAL_BASE='https://glmsmp.vercel.app/MetExp/';
var MANUAL_DB=[
// ── VACUUM SYSTEM ──
{cat:'vacuum',ico:'🔵',vendor:'Busch',name:'COBRA NC 630 C — Direct Cooling Spare Parts',file:'COBRA NC 0630 C (direct cooling water system) EN spdf.pdf',type:'spares'},
{cat:'vacuum',ico:'🔵',vendor:'Busch',name:'COBRA NC 630 B — Plate Heat Exchanger Spare Parts',file:'COBRA NC 630 B (with plate heat exchanger) EN.pdf',type:'spares'},
{cat:'vacuum',ico:'🟢',vendor:'Aerzen',name:'Aerzen Application Manual — Roots Booster',file:'Aerzen_Application_manual_00MZG1B-K202_Rev_1D.pdf',type:'manual'},
{cat:'vacuum',ico:'🟣',vendor:'Varian/Edwards',name:'Vacuum Blower Pump — Canned Motor G4',file:'Vacuum_Blower_Pump_Canned_Motor_ G4-014_180_184_000_12_2012.pdf',type:'manual'},
{cat:'vacuum',ico:'🔴',vendor:'Edwards',name:'Active Inverted Magnetron Gauge — AIM',file:'Active_Inverted_Magnetron_Gauge_D146-41-885.pdf',type:'datasheet'},
{cat:'vacuum',ico:'🟡',vendor:'MKS',name:'MKS Baratron 627B — Capacitance Manometer',file:'MKS_Baratron_627Bmanual_revB[1].pdf',type:'manual'},
{cat:'vacuum',ico:'🟡',vendor:'MKS',name:'MKS Mass-Flo Controller 1179A/2179A',file:'MKS_Mass-Flo Controller_1179a-2179a-179aman[1].pdf',type:'manual'},
{cat:'vacuum',ico:'🟡',vendor:'MKS',name:'MKS MicroPirani 925 Gauge',file:'MKS_Micropirani_17129 - 925 Manual - REV D.pdf',type:'manual'},
{cat:'vacuum',ico:'🔵',vendor:'Various',name:'Capsule Dial Gauge — D356-10-880',file:'Capsule_Dial_Gauge_D356-10-880.pdf',type:'datasheet'},
{cat:'vacuum',ico:'🔵',vendor:'Various',name:'CG16K Capsule Dial Gauge',file:'CG16K capsule dial gauge datasheet - D05900895 C.pdf',type:'datasheet'},
{cat:'vacuum',ico:'🟠',vendor:'Various',name:'Speedivalve Hand Valve',file:'Speedivalve_Hand_Valve_C331-55-885.pdf',type:'datasheet'},
{cat:'vacuum',ico:'🔵',vendor:'Various',name:'Atomuffler Filter Silencer',file:'Atomuffler_Filter_Silencer.pdf',type:'datasheet'},

// ── DRIVES & VFDs ──
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV71 Installation Manual',file:'ATV71_Installation_Manual_03_2011.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV71 Programming Manual V6.5',file:'ATV71_Programming_Manual_SW_V6_5_05_2015.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV71 Quick Start Manual',file:'ATV71_Quick_Start_Manual_S1B8698200_2016.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV71 Profibus User Manual',file:'ATV71_Profibus_User_Manual_10_2009.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV71 VW3A330X Communication Card',file:'ATV71_VW3A330X_Data_Sheet.pdf',type:'datasheet'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV71 VW3A340X Communication Card',file:'ATV71_VW3A340X_Data_Sheet.pdf',type:'datasheet'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'Altivar ATV Hardware Guide',file:'Altivar_ATV_Hardware_Guide_04_2014.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV61/ATV71 Maintenance Manual V1.6 (Part 1)',file:'Maintenance Manuel ATV61-71 Release V1.6 full-1.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV61/ATV71 Maintenance Manual V1.6 (Part 2-1)',file:'Maintenance Manuel ATV61-71 Release V1.6 full-2-1.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV61/ATV71 Maintenance Manual V1.6 (Part 2-2)',file:'Maintenance Manuel ATV61-71 Release V1.6 full-2-2.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'ATV61/ATV71 Maintenance Manual V1.6 (Part 2-3)',file:'Maintenance Manuel ATV61-71 Release V1.6 full-2-3.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'Altivar 312 Manual',file:'Schneider-Altivar-312-Manual.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'Altivar 312 Programming',file:'Schneider-Altivar-312-Programming.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Schneider',name:'Altivar 312 Quick Start',file:'Schneider-Altivar-312-Quick-Start.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Siemens',name:'SINAMICS G120C Installation Manual',file:'G120 Installation Manual.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Siemens',name:'SINAMICS G120C List Manual',file:'SINAMICS G120C_List_Manual.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'Siemens',name:'SINAMICS G120C Operating Instructions',file:'SINAMICS_G120C_en-US.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'CT/Nidec',name:'Unidrive SP Installation Guide',file:'CT_Unidrive_SP_ Low_Voltage_Installation_Guide_Issue_1.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'CT/Nidec',name:'Unidrive SP Advanced User Guide',file:'CT_Unidrive_SP_Advanced_User_Guide_Issue_9.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'CT/Nidec',name:'Unidrive SP Pocket Start Up Guide',file:'Unidrive SP Pocket Start Up Guide.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'CT/Nidec',name:'Unidrive SP Short Form Guide',file:'Unidrive_SP_Short_Form_Guide_Issue_3.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'CT/Nidec',name:'XL50 Basic Drive Manual',file:'XL50_BASIC_DRIVE_MANUAL.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'AE',name:'Thyro-A Power Controller Manual',file:'AE_Thyro-A_EN_Version 11.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'AE',name:'Thyro-A Ethernet/IP Bus Module',file:'AE_Bus_Moduel_Ethernet_IP_EN_AE_Version_4.pd.pdf',type:'manual'},
{cat:'drives',ico:'⚡',vendor:'REO',name:'REO Braking & Charging Resistors',file:'REO Braking- and charging resistors.pdf',type:'datasheet'},

// ── SM MODULES (CT/Nidec) ──
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-PROFIBUS DP-V1 User Guide',file:'SM-PROFIBUS DP-V1 User Guide.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Profibus-DP Issue 8',file:'SM-Profibus-DP Iss 8.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-EtherCAT Issue 2',file:'SM-EtherCAT iss2.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Ethernet Issue 6',file:'SM-Ethernet issue 6.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-DeviceNet Issue 5b',file:'SM-DeviceNet_Iss5b.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-CANopen Issue 8',file:'SM-CANopen Iss 8.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-CAN Issue 2',file:'SM-CAN Issue 2.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-INTERBUS Issue 3',file:'SM-INTERBUS Issue 3.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-LON Issue 1',file:'SM-LON iss1.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-SERCOS Issue 6',file:'SM-SERCOS Issue 6.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Apps Mod & Motion Processors',file:'SM-Apps Mod \\u0026 Motion Processors Iss 3.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-EZMotion User Guide',file:'SM-EZMotion UG IssA5.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-IO Plus Issue 6',file:'SM-IO Plus iss6.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-IO 24V Protected Issue 2',file:'SM-IO 24V Protected UG iss2.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-IO 120V Issue 2',file:'SM-IO 120V iss2.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-IO 32 Issue 1',file:'SM-IO 32 UG Iss1.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-I/O Lite Timer Issue 4',file:'SM-I_O Lite _Timer UG iss4.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Keypad Installation Sheet',file:'SM-Keypad Installation Sheet.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Keypad Plus Issue 1',file:'SM-Keypad Plus Iss1.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-PELV Issue 3',file:'SM-PELV iss3.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Register Issue 2',file:'SM-Register UG Iss2.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Resolver Issue 4',file:'SM-Resolver iss4.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-SLM Issue 5',file:'SM-SLM UG iss5.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'SM-Uni Enc Plus Issue 6',file:'SM-Uni Enc Plus Iss 6.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'CTNet User Guide Issue 8',file:'CTNet_User_Guide_Issue_8.pdf',type:'manual'},
{cat:'sm_modules',ico:'🔌',vendor:'CT/Nidec',name:'CT Fieldbus Issue M8',file:'CT_Fieldbus_Issue_M8.pdf',type:'manual'},

// ── PLC & AUTOMATION ──
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 1-1)',file:'B&R_X20_System_Users_Manual_Version_1_20-1-1.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 1-2)',file:'B&R_X20_System_Users_Manual_Version_1_20-1-2.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 1-3)',file:'B&R_X20_System_Users_Manual_Version_1_20-1-3.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 2)',file:'B&R_X20_System_Users_Manual_Version_1_20-2.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 3-1)',file:'B&R_X20_System_Users_Manual_Version_1_20-3-1.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 3-2-1)',file:'B&R_X20_System_Users_Manual_Version_1_20-3-2-1.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 System User Manual V1.20 (Part 3-2-2)',file:'B&R_X20_System_Users_Manual_Version_1_20-3-2-2.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20CPx48x CPU Data Sheet',file:'B&R_X20CPx48x.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20IF1063 Interface Module',file:'B&R_X20IF1063.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20BT9100 Module',file:'B&R_X20BT9100.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20TBxx Terminal Block',file:'B&R_X20TBxx.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X67PS1300 Power Supply',file:'B&R_X67PS1300.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X67 Interconnection Cables',file:'B&R_Interconnection_Cables_X67_Data_Sheet.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'Compact Flash Card Data Sheet',file:'B&R_Compact_Flash_Card_Data_Sheet.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20BM11 Module',file:'X20BM11-GER[1].pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20 CPUs Reference',file:'X20CPUs-ENG.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'X20IF1063 Interface Reference',file:'X20IF1063-ENG.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'CF Card FAQ',file:'FAQ B&R CF_V01.10_ENG.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'B&R',name:'ACOPOSmicro Drive Module',file:'ACOPOSmicro.pdf',type:'datasheet'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'ET200M Distributed I/O',file:'ET200M_e.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'ET200S Distributed I/O',file:'ET200S.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'IPC227D Operating Instructions',file:'ipc227d_operating_instructions_en-US_en-US.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'IPC227D Quick Install Guide',file:'ipc227d_quick_install_guide_DO-V2.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'TeleService V6.1',file:'TeleService V6.1.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'PROFINET Step 7 V13 Function Manual',file:'profinet_step7_v13_function_manual_en-US_en-US.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'Safety Integrated Function Manual',file:'Safety_Integrated_Function_Manual_en-US[1].pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Siemens',name:'Security for PC-based Automation',file:'Security for PC-based Automation.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'HMS',name:'Anybus ABC-PDP User Manual',file:'HMS_Anybus_ABC-PDP User Manual 2_02.pdf',type:'manual'},
{cat:'plc',ico:'🖥️',vendor:'Various',name:'RS 485 Repeater',file:'RS 485 Repeater.pdf',type:'datasheet'},

// ── PROFIBUS ──
{cat:'profibus',ico:'🔗',vendor:'PI',name:'PROFIBUS Cabling & Assembly Guide',file:'PROFIBUS Installation Guideline for Cabling and Assembly.pdf',type:'manual'},
{cat:'profibus',ico:'🔗',vendor:'PI',name:'PROFIBUS Planning Guide',file:'PROFIBUS_Installation_Guideline_for_Planning.pdf',type:'manual'},
{cat:'profibus',ico:'🔗',vendor:'PI',name:'PROFIBUS Planning Supplement',file:'PROFIBUS_Installation_Guideline_for_Planning-Supplement.pdf',type:'manual'},
{cat:'profibus',ico:'🔗',vendor:'PI',name:'PROFIBUS Commissioning Guide',file:'Profibus Installation Guideline for Commissioning.pdf',type:'manual'},
{cat:'profibus',ico:'🔗',vendor:'PI',name:'PROFIBUS Technology & Application',file:'Profibus Technology and Application.pdf',type:'manual'},
{cat:'profibus',ico:'🔗',vendor:'Siemens',name:'Profibus FastConnect Plug',file:'Profibus-Fastconnect plug.pdf',type:'datasheet'},

// ── SENSORS & INSTRUMENTS ──
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AS-Interface Manual',file:'IFM_Manual_AS-Interface_UK_Rel.2.2_web.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC2616 ASi Interface',file:'IFM AC2616_Asi_Interface_Installation Instructions.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC2516 Installation',file:'IFM_AC2516_Installation_Manual_eng.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC5000 ASi Module',file:'IFM_AC5000_Data_Sheet.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC5020 ASi Module',file:'IFM_AC5020_Data_Sheet.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC1218 Power Supply',file:'IFM_AC1218_PSU_Instructions_7390423DEESFRITPTUK.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC1258 ASi Power Supply',file:'IFM_AC1258_AS-Interface Power Supply.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC1375 Interface Unit',file:'IFM_Interface_Unit_AC1375_Installation instructions.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM SM6004 Flow Sensor',file:'IFM_SM6004_Flow_Sensor.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM PA3024 Sensor',file:'IFM PA3024_Sensor_704090UK_Installation Instructions.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM PT100 Temperature Sensor TT1250',file:'IFM_PT100_Temperature Sensor_TT1250.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM TN2531 Temperature Sensor',file:'IFM_TN2531_Temperature_Sensor_704771UK.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM Dual Sensor T5',file:'IFM_Dual_Sensor_T5_Instructions_7390436DEFRUK.pdf',type:'manual'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM Proximity Switch',file:'IFM_Proximity-Switch_1D2226UK.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM LMT Level Sensor',file:'IFM_LMT_Level_Sensor_0900766b80fb6a07.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM Progressive Ring Fitting',file:'IFM_Progressive_Ring_Fitting_701308.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM ASi Termination',file:'IFM_Termination _7390467DEFRUK.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM Bus System ASi AC5005',file:'ifm_Bus system AS-Interface_AC5005.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM AC2515 Module',file:'AC2515.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'IFM',name:'IFM ac1218 Reference',file:'ac1218.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Hobut',name:'DIN Range Panel Meters',file:'Hobut Din Range Panel Meters.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Hobut',name:'14 Series Current Transformer',file:'Hobut_14_Series_Current_Transformer.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Various',name:'Glass Variable Area Flowmeters',file:'Glass Variable Area Flowmeters.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Kobold',name:'Kobold Flowmonitor DF-WM',file:'Kobold_Flowmonitor_DF-WM.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Various',name:'Float-Type Flow Meter',file:'Float-Type Flow Meter.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Sick',name:'ATM60-90 Rotary Encoder',file:'ATM60-90_3017.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Sick',name:'ATM60 Online Data Sheet',file:'online_data_sheet_ATM60-AAM12X12_en_20140319_1443.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'Various',name:'Rotary Encoders Catalogue',file:'Rotary encoders Oct2009.pdf',type:'datasheet'},
{cat:'sensors',ico:'📡',vendor:'OptiTrack',name:'Tracker 505 Operating Manual',file:'OpMan Tracker 505-EN (98-1240).pdf',type:'manual'},

// ── PNEUMATICS ──
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Standard Cylinders',file:'Festo_Standard_Cylinders.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo One-Way Flow Control Valves',file:'Festo_Oneway_Flow_Control_Valves.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Exhaust Flow Control Valve',file:'Festo_Exhaust_Flow_Control_Valve.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Pressure Regulators',file:'Festo_Pressure_Regulators.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Pressure Switch',file:'Festo_Pressure_Switch.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Proximity Switch',file:'Festo_Proximity_Switch_data_Sheet.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Service Unit Combinations',file:'Festo_Service_Unit_Combinations.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Connections',file:'Festo_Connections.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo Manual Override Tool',file:'Festo_Manual_override_Tool.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo ASi Equipment',file:'Festo_Asi_Equipment.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Festo',name:'Festo ASi Interface Unit',file:'Festo_Asi_Interface_Unit.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Bray',name:'Bray ACG Solenoid Valve',file:'Bray_ACG Solenoid Valve.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Bray',name:'Bray Actuator S92-93 O&M',file:'Bray_Actuator S92-93 OM.pdf',type:'manual'},
{cat:'pneumatics',ico:'💨',vendor:'Various',name:'Series 30/31 Valves',file:'Series_30_31_valves.pdf',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Various',name:'Solenoid Valves Catalogue',file:'SOLENOID VALVES.PDF',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Various',name:'Solenoid Valve 2/2 Way N.C.',file:'Solenoid valve 22 way N.C..PDF',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Various',name:'Quick Couplings Catalogue',file:'QUICK-COUPLINGS_EN.PDF',type:'datasheet'},
{cat:'pneumatics',ico:'💨',vendor:'Various',name:'PN16 Cast Iron Strainer',file:'PN16 Cast Iron Strainer.pdf',type:'datasheet'},

// ── ELECTRICAL ──
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'Circuit Breakers Type D',file:'Siemens_Circuit_Breakers_Type_D.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'MCB Primer Guide',file:'Siemens_MCB_Primer_EN_201601250852395217.pdf',type:'manual'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'SIRIUS Circuit Breaker 3RV2',file:'Siemens_SIRIUS_Circuit_Breaker_3RV2_en-US.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'SIRIUS Contactor S2',file:'Siemens Sirus Contactor_S2.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'3RW3038 Soft Starter',file:'Siemens _3RW3038-1BB04_Soft_Start.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'IE3 Motors Switching Application',file:'Siemens_application_manual_switching_devices_IE3_motors_en-US.pdf',type:'manual'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'SIRCO Load Break Switches',file:'SIRCO Load break switches.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'Safety Relay 3TK2822/3TK2823',file:'Safety Relay (3TK2822-3TK2823).pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'Safety Relay 3TK2827/3TK2828',file:'Safety Relay (3Tk2827, 3TK2828).pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'Two-Hand Control Unit 3TK2834',file:'Two-hand control unit (3TK2834).pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'Magnetic Switch 3SE6604',file:'Magnetic _Switch_3SE6604-2BA01.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Siemens',name:'Switching Magnet 3SE6704',file:'Switching_Magnet_3SE6704-3BA.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Allen Bradley',name:'Safety Relay Module',file:'Allen_Bradley_Safety_Relay_0900766b813dd973.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Klockner',name:'Moeller Isolator Switch',file:'Klockner_Moellar_Isolator_Switch_1801036.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Telemecanique',name:'LC1F115 Contactor User Manual',file:'Telemecanique_User_Man_LC1F115_1250_1355817_01a55-17.pd.pdf',type:'manual'},
{cat:'electrical',ico:'🔌',vendor:'Telemecanique',name:'F Series Coils',file:'Telemecanique_F_Series_Coils_0900766b80a59616.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Telemecanique',name:'Mini Control Relays',file:'Telemecanique_Mini_Control_Relays_1643496.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Telemecanique',name:'XAL-SZ1E Data Sheet',file:'Telemecanique_XAL-SZ1E  Data Sheet.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Omron',name:'G2RS Relay',file:'G2RS_Relay_0900766b8137b9cc.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Omron',name:'G2R General Purpose Relay',file:'G2R_General_Purpose_Relay_0900766b8137b9d9.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Omron',name:'G3R I/O Relays',file:'G3R_IO_Relays_0900766b8137b9d0.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Wago',name:'Wago 788-312 Relay Socket',file:'Wago_788-312_Relay_Socket.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Various',name:'Circuit Breakers General',file:'Circuit Breakers.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Various',name:'Thermistor Motor Protection',file:'Thermistor Motor Protection Tripping Units.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Various',name:'Surge Suppression Module',file:'Surge Suppression Module.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Various',name:'Surge Protection Data Sheet',file:'Surge protection - Data Sheet.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔌',vendor:'Various',name:'Data Sheet IS VPU II',file:'Data_Sheet_IS_VPU_II.pdf',type:'datasheet'},

// ── POWER SUPPLIES ──
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Emparro PSU',file:'Murr_Elecktronik_Emparro_PSU_85692_ina_4_14.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Elektronik 52001',file:'Murr_Elektronic_52001.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Elektronik 52501',file:'Murr_Elektronik_52501.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Elektronik 52511',file:'Murr_Elektronik_52511.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Elektronik 85002',file:'Murr_Elektronic_85002.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Elektronik 85004',file:'Murr_Elektronic_85004.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr MICO Basic 4.6',file:'Mico_Basic 4_6_Unit_9000-41064-0600000_Version1_5.pdf',type:'manual'},
{cat:'electrical',ico:'🔋',vendor:'Murr',name:'Murr Elektronik 9000-41064',file:'Murr_Elektronic_9000-41064-0600000.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Meanwell',name:'Meanwell MDR-100 PSU',file:'Meanwell_MDR-100-spec.pd.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'RS',name:'RS 282-524 Power Supply',file:'RS_282-524_Power Supply.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Various',name:'Switch Mode Power Supply',file:'Switch Mode Power Supply.pdf',type:'datasheet'},
{cat:'electrical',ico:'🔋',vendor:'Various',name:'DRT-960 PSU',file:'drt-960.pdf',type:'datasheet'},

// ── COOLING & CHILLER ──
{cat:'chiller',ico:'❄️',vendor:'BOBST/GRE',name:'Bobst Heater Chiller 24-80kW IOM (Part 1)',file:'Bobst Heater Chiller - 24-80kW - IOM - r2_02Mar13-1.pdf',type:'manual'},
{cat:'chiller',ico:'❄️',vendor:'BOBST/GRE',name:'Bobst Heater Chiller 24-80kW IOM (Part 2)',file:'Bobst Heater Chiller - 24-80kW - IOM - r2_02Mar13-2.pdf',type:'manual'},
{cat:'chiller',ico:'❄️',vendor:'BOBST/GRE',name:'Bobst Chillers Standard Spare Parts',file:'Bobst Chillers (Std) - Spare parts list r2.pdf',type:'spares'},
{cat:'chiller',ico:'❄️',vendor:'Rankine',name:'24kW Chiller Rankine Spare Parts',file:'24kW Chiller Rankine Spare parts list.pdf',type:'spares'},
{cat:'chiller',ico:'❄️',vendor:'Various',name:'Refrigeration & Installation Guide',file:'Refrigeration_and_Installation_Guide.pdf',type:'manual'},
{cat:'chiller',ico:'❄️',vendor:'Various',name:'DIEKAN 1640 Coolant Data',file:'DIEKAN 1640 Data _ English.pdf',type:'datasheet'},
{cat:'chiller',ico:'❄️',vendor:'Various',name:'DIEKAN 1640 Safety Data',file:'DIEKAN 1640 Safety _  English.pdf',type:'datasheet'},

// ── BOBST MACHINE DOCS ──
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'COM.3411 General Schema',file:'COM.3411 SCHEMA GENERALE.pdf',type:'schematic'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'COM.3411 Inverter Schema',file:'COM.3411 SCHEMA INVERTER.pdf',type:'schematic'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'COM.3411 PLC Schema',file:'COM.3411 SCHEMA PLC.pdf',type:'schematic'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'COM.5110 MR-VP 20K Marked Up Drawings',file:'COM.5110 MANUALE MR-VP 20K-CH ENG_Marked Up Drawings-MVF.pdf',type:'schematic'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'COM.3411 Vacuum MR-VP 10K Manual',file:'COM_3411 Manuale General Vacuum MR-VP 10K - INGLESE.pdf',type:'manual'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'General Safety & Operating Instructions',file:'GENERAL SAFETY, ASSEMBLY, OPERATING, USE,AND MAINTENANCE INSTRUCTIONS.pdf',type:'manual'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'825064-00 Revision 11',file:'825064-00-Revision 11.pdf',type:'manual'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'CE Certificate',file:'CE certificate.pdf',type:'datasheet'},
{cat:'bobst',ico:'🏭',vendor:'BOBST',name:'PFEA111-112 Reference',file:'PFEA111-112.tmp.pdf',type:'datasheet'},

// ── MOTORS & MOTION ──
{cat:'motors',ico:'⚙️',vendor:'Stögra',name:'Stögra Stepper Drive',file:'stogra stepper drive.pdf',type:'datasheet'},
{cat:'motors',ico:'⚙️',vendor:'Stögra',name:'Stögra Stepper Motors',file:'stogra stepper motors.pdf',type:'datasheet'},
{cat:'motors',ico:'⚙️',vendor:'Various',name:'Stepper Motors Catalogue',file:'Stepper Motors Catalogue.pdf',type:'datasheet'},
{cat:'motors',ico:'⚙️',vendor:'Schneider',name:'BMH0702 Servo Motor',file:'BMH0702P01F1A_Motor_Datasheet.pdf',type:'datasheet'},
{cat:'motors',ico:'⚙️',vendor:'Siemens',name:'Synchronous Motors 1FK7',file:'Synchronous motors 1FK7.pdf',type:'datasheet'},
{cat:'motors',ico:'⚙️',vendor:'Various',name:'Separately Ventilated 3-Phase Motors',file:'Separately Ventilated Three Phase Motors.pdf',type:'datasheet'},
{cat:'motors',ico:'⚙️',vendor:'Various',name:'Planetary Gearbox Instruction Manual',file:'Planetry_Gearbox_Instruction_Manual.pdf',type:'manual'},
{cat:'motors',ico:'⚙️',vendor:'Alpha',name:'Alpha Gearbox LP/LPB',file:'Alpha gearbox lp-lpb.pdf',type:'datasheet'},

// ── MECHANICAL ──
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF CARB Toroidal Roller Bearings',file:'SKF_CARB toroidal roller bearings.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF CARB Reference',file:'SKF_Carb.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF Cam Followers',file:'SKF_Cam followers - 148081030.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF Deep Groove Ball Bearings',file:'SKF_Deep_Groove_Ball_Bearings.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF Spherical Bearings',file:'SKF_Spherical_bearings_EN.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF Maintenance Products (Part 1)',file:'SKF_Maintenance_Products-1.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF Maintenance Products (Part 2)',file:'SKF_Maintenance_Products-2.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'SKF Maintenance Products (Part 3)',file:'SKF_Maintenance_Products-3.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'SKF',name:'Super-precision Angular Contact Bearings',file:'Super-precision angular contact ball bearings 72 D series_EN.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'ETP',name:'ETP Express Mounting Instructions',file:'ETP-EXPRESS-MOUNTING-INSTRUCTIONS.pdf',type:'manual'},
{cat:'mechanical',ico:'🔧',vendor:'ETP',name:'ETP Express Product Sheet',file:'ETP-EXPRESS-PRODUCT-SHEET.pd.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'ETP',name:'ETP Express Technical Manual',file:'ETP_EXPRESS_Technical_Manual.pdf',type:'manual'},
{cat:'mechanical',ico:'🔧',vendor:'KTR',name:'KTR Clamping Nut Instructions',file:'KTR_Clamping Nut_Mounting Instructions.pdf',type:'manual'},
{cat:'mechanical',ico:'🔧',vendor:'KTR',name:'KTR Radex-N Coupling',file:'KTR_Radex-N_Coupling.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'HIWIN',name:'HIWIN DDB Ballnut',file:'HIWIN GMBH DDB ballnut.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'INA',name:'INA Linear Technology',file:'INA Linear Technology.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Various',name:'Linear Guideway Catalogue',file:'Linear Guidway.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Various',name:'Four-row Linear Ball Bearing',file:'Four-row linear recirculating ball bearing.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Svecom',name:'Svecom Mechanical Shafts',file:'Svecom_Mechanical_Shafts.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Svecom',name:'Svecom Shaft 3D Drawing',file:'Svecom_Mechanical_Shaft_3D_Drawing.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Various',name:'Mechanical Shaft Data Sheet',file:'Mechanical_Shaft_Data_Sheet.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Kickert',name:'Kickert Spreader Roller',file:'kickert-spreader-roller.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Ruland',name:'Ruland Nomar Coupling Catalogue',file:'Ruland_Nomar_Catalogue.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Various',name:'Flexible Couplings',file:'flexible_Couplings.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Rotec',name:'Rotec Bridge Adapter',file:'rotec_Bridge_Adapter_EN.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Rotec',name:'Rotec Unifit Adapter',file:'rotec_Unifit_Adapter_EN.pd.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Source',name:'Strobe Coupling Catalogue',file:'Source_Strobe_Coupling_Cat.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Source',name:'Strobe Coupling Installation',file:'Source_Strobe_Coupling_Installation_Instructions.pdf',type:'manual'},
{cat:'mechanical',ico:'🔧',vendor:'Simprit',name:'Simprit Seal Details',file:'Simprit_Seal_Details.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Simprit',name:'Simprit Simmerings 2010',file:'Simprit_simmerings_2010.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Merkel',name:'Merkel Omegat OMS MR Seal',file:'Merkel_Omegat_OMS_MR_Data_sheet..pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Various',name:'Pull Action Latch Clamps',file:'Pull Action Latch Clamps.pdf',type:'datasheet'},
{cat:'mechanical',ico:'🔧',vendor:'Various',name:'Belt Drive PM Manual',file:'Belt_Drive _PM_Manual.pdf',type:'manual'},

// ── NETWORKING & CONNECTORS ──
{cat:'network',ico:'🌐',vendor:'Harting',name:'Harting H6 Socket',file:'Harting H6 Socket_09330062601.pdf',type:'datasheet'},
{cat:'network',ico:'🌐',vendor:'Harting',name:'Harting 8-Port Ethernet Switch',file:'Harting_ETHERNET_SWITCH_8_PORT 10100Mbps_.pdf0900766b81313430.pdf',type:'datasheet'},
{cat:'network',ico:'🌐',vendor:'Harting',name:'Harting Ha-Vis eCon Ethernet Switch',file:'Harting_Ha_Vis_eCon_Ethernet_Switch_1719969.pdf',type:'datasheet'},
{cat:'network',ico:'🌐',vendor:'Various',name:'LMF/LMG Connectors Catalogue',file:'LMF_LMG_Connectors_catalogue.pdf',type:'datasheet'},

// ── SAFETY & ENCLOSURES ──
{cat:'safety_hw',ico:'🛡️',vendor:'Rittal',name:'Rittal Assembly & Operating Instructions',file:'Rittal Assembly and operating instructions.pdf',type:'manual'},
{cat:'safety_hw',ico:'🛡️',vendor:'Rittal',name:'Rittal Assembly Instructions',file:'Rittal Assembly instructions.pdf',type:'manual'},
{cat:'safety_hw',ico:'🛡️',vendor:'Rittal',name:'Rittal Info Sheet',file:'Rittal Info sheet.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Berstein',name:'Berstein Footswitch',file:'Berstein_Footswitch_1825130.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Siemens',name:'Door Operated Switch SZ 4127',file:'Door_Operated_Switch_SZ_4127_010.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Klaxon',name:'Klaxon Beacon',file:'Klaxon_Beacon_0900766b8118d42f.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Roshni',name:'Roshni Sounder',file:'Roshni_Sounder_0900766b80689a12.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Various',name:'14CE9 Miniature Enclosed Switch',file:'14CE914CE Series Miniature Enclosed_XP-4040-5-ML.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Various',name:'HYGARD Polycarbonate Laminates',file:'HYGARD Polycarbonate Laminates.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Various',name:'Makrolon Hygard BR 750',file:'Makrolon_Hygard_BR_750_EN.pdf',type:'datasheet'},
{cat:'safety_hw',ico:'🛡️',vendor:'Various',name:'TD170 Actuator Safety Manual',file:'TD170 - Iss C - Product Safety Manual Actuator, Spring and Limit Switch Box.pdf',type:'manual'},

// ── HMI & MONITORING ──
{cat:'hmi',ico:'🖥️',vendor:'ELO',name:'ELO Intellitouch 3.2 Touch System',file:'ELO_Intellitouch_3.2.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'ELO',name:'ELO LCD Open-Frame Touchmonitor',file:'ELO_LCD OPEN-FRAME TOUCHMONITORe481511_b.pd.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'Various',name:'ESP CCTV Monitor Manual',file:'ESP_CCTV_Monitor_Manual.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'Apollo',name:'Apollo HD Series DVR Manual',file:'ApolloHDSeriesDVRUsersManual_001updated.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'Apollo',name:'iApollo HD RTLite User Guide',file:'iApolloHDRTLiteiApolloHDRTIOUsersGuide06-2013.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'Genie',name:'Genie 96 Series CCTV Manual',file:'Genie_96 SERIES Manual.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'Genie',name:'Genie W96MDV CCTV Datasheet',file:'Genie_W96MDV CCTV_Series Datasheet.pdf',type:'datasheet'},
{cat:'hmi',ico:'🖥️',vendor:'Brother',name:'Brother HL3140CW Network Guide',file:'Brother_Network_User_Guide_cv_hl3140cw_eng_net.pdf',type:'manual'},
{cat:'hmi',ico:'🖥️',vendor:'Brother',name:'Brother HL3140CW User Guide',file:'Brother_User_Guide_cv_hl3140cw_use_usr.pdf',type:'manual'},

// ── MISC ──
{cat:'misc',ico:'📦',vendor:'Various',name:'Swagelok A-LOK Tube Fittings',file:'4233 A-LOK Tube Fittings1.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Swagelok Hoses MS-01-167',file:'MS-01-167_Hoses.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Armaflex 520 Adhesive MSDS',file:'520_Adhesive_MSDSArmaflex520AUS.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Brazing Tools Guide',file:'Brazing Tools.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Cold Work Application Guidance',file:'Cold_Work_Application_Guidance.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'How To Insulate Pipes & Fittings',file:'How_To_Insulate_Pipes_And_Fittings.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Igus',name:'Igus Cable Coiler Guidelines',file:'Igus_Cable_Coiler_Design_Guidelines.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'PlexTec',name:'PlexTec Particle Filter',file:'Datasheet PlexTec Particle Filter - GB.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Arcoflex',name:'Arcoflex 314 Data Sheet',file:'Arcoflex_314_data_sheet.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Ashworth',name:'Albion 54 Series Ball Valve',file:'ashworth - albion 54 series full bore ball valve.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Storage & Preservation Guidelines',file:'Storage_\\u0026_Preservation_Guidelines_TN01175 E XA_11_08.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'EG Series Catalogue',file:'EG-Series-Catalog Online.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'890 QuickStart Manual',file:'890 QuickStart Manual.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Application Manual',file:'Application_Manual.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Installation & Maintenance General',file:'Installation_And_Maintenance.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Installation Instructions 2016',file:'Installation_Instructions_From_Website_2016.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Mounting Instructions',file:'Mounting instructions.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'GE Proline Multi-Volt Ballast',file:'Specification GE_-Sheet-Proline-Multi-Volt-T12-Ballast.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'J6 Series Reference',file:'J6 Series.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'J6D PSW Reference',file:'J6D_PSW.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Siemens',name:'CP31x Communication Module',file:'cp31x.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'DGS60/65/66 Reference',file:'DGS60_65_66_E.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'55 Series Repair Instructions',file:'55 series_Repair_Instructions.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'755 Series DA-43 Repair Instructions',file:'755 Series DA-43-Repair_Instructions.pdf',type:'manual'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Catalogue Series 55+57',file:'Catalogue 075-Q GB 6-12 Series 55+57.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'RU 093 Series 755',file:'RU 093 GB screen 13 Series 755.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Type 6539S Reference',file:'Type 6539S-1-103.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'BW155 Drawing',file:'bw155_12000_25_dwg.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'Data Sheet General',file:'Data_Sheet.PDF',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'E250918 Reference',file:'e250918_a.pdf',type:'datasheet'},
{cat:'misc',ico:'📦',vendor:'Various',name:'SP1 Reference',file:'sp1.pdf',type:'datasheet'}
];

var MANUAL_CATS=[
  {id:'all',label:'सभी',labelEn:'All'},
  {id:'vacuum',label:'वैक्युम',labelEn:'Vacuum'},
  {id:'drives',label:'ड्राइव्स/VFD',labelEn:'Drives'},
  {id:'sm_modules',label:'SM मॉड्यूल',labelEn:'SM Modules'},
  {id:'plc',label:'PLC/ऑटोमेशन',labelEn:'PLC'},
  {id:'profibus',label:'PROFIBUS',labelEn:'Profibus'},
  {id:'sensors',label:'सेंसर',labelEn:'Sensors'},
  {id:'pneumatics',label:'वायवीय',labelEn:'Pneumatics'},
  {id:'electrical',label:'विद्युत',labelEn:'Electrical'},
  {id:'chiller',label:'चिलर',labelEn:'Chiller'},
  {id:'bobst',label:'BOBST मशीन',labelEn:'BOBST'},
  {id:'motors',label:'मोटर',labelEn:'Motors'},
  {id:'mechanical',label:'मैकेनिकल',labelEn:'Mechanical'},
  {id:'network',label:'नेटवर्क',labelEn:'Network'},
  {id:'safety_hw',label:'सुरक्षा HW',labelEn:'Safety HW'},
  {id:'hmi',label:'HMI/मॉनिटर',labelEn:'HMI'},
  {id:'misc',label:'अन्य',labelEn:'Misc'}
];

// ══════════════════════════════════════════════════════
// RENDER MANUALS PAGE
// ══════════════════════════════════════════════════════
var _manCurCat='all',_manSearch='';
function rManuals(pg){
  var h='<div class="ph"><div class="ph-code">OEM MANUAL LIBRARY — '+MANUAL_DB.length+' EQUIPMENT PDFs</div>'
    +'<div class="ph-title">OEM <span>मैनुअल</span></div>'
    +'<div class="ph-desc">BOBST K5 Expert और सभी auxiliary equipment के OEM manuals, datasheets और schematics — PDF viewer में पढ़ें।</div>'
    +'<div class="tags"><span class="tag a">'+MANUAL_DB.length+' PDFs</span><span class="tag c">15+ Categories</span><span class="tag g">Inline Viewer</span></div></div>';
  // Search
  h+='<input class="man-search" id="manSearch" placeholder="🔍 Search manuals... (e.g. ATV71, Cobra, SKF, Festo)" oninput="_manSearch=this.value;filterManuals()" value="'+escH(_manSearch)+'">';
  // Category chips
  h+='<div class="man-cats" id="manCats">';
  MANUAL_CATS.forEach(function(c){
    var cnt=c.id==='all'?MANUAL_DB.length:MANUAL_DB.filter(function(m){return m.cat===c.id;}).length;
    h+='<button class="man-cat'+(c.id===_manCurCat?' on':'')+'" onclick="_manCurCat=\''+c.id+'\';filterManuals()">'+c.label+'<span class="man-cat-count">'+cnt+'</span></button>';
  });
  h+='</div>';
  // Results info
  h+='<div class="man-count-info" id="manCountInfo"></div>';
  // Grid
  h+='<div class="man-grid" id="manGrid"></div>';
  pg.innerHTML=h;
  filterManuals();
}

function filterManuals(){
  var q=(_manSearch||'').toLowerCase().trim();
  var cat=_manCurCat;
  var items=MANUAL_DB.filter(function(m){
    if(cat!=='all'&&m.cat!==cat)return false;
    if(!q)return true;
    var s=(m.name+' '+m.vendor+' '+m.file+' '+m.cat).toLowerCase();
    var words=q.split(/\s+/);
    return words.every(function(w){return s.indexOf(w)>=0;});
  });
  // Update count
  var ci=document.getElementById('manCountInfo');
  if(ci) ci.innerHTML='<strong>'+items.length+'</strong> / '+MANUAL_DB.length+' मैनुअल दिखा रहे हैं';
  // Update category chips
  var chips=document.querySelectorAll('.man-cat');
  chips.forEach(function(c,i){c.classList.toggle('on',MANUAL_CATS[i].id===cat);});
  // Render grid
  var g=document.getElementById('manGrid');
  if(!g)return;
  if(items.length===0){
    g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">❌ कोई मैनुअल नहीं मिला। दूसरा keyword आज़माएं।</div>';
    return;
  }
  var typeMap={manual:'📘 Manual',datasheet:'📊 Datasheet',schematic:'📐 Schematic',spares:'🔩 Spares'};
  var typeClass={manual:'manual',datasheet:'datasheet',schematic:'schematic',spares:'spares'};
  var colorMap={vacuum:'rgba(96,165,250,.15)',drives:'rgba(251,146,60,.15)',sm_modules:'rgba(192,132,252,.15)',plc:'rgba(37,211,102,.15)',profibus:'rgba(30,184,208,.15)',sensors:'rgba(240,165,0,.15)',pneumatics:'rgba(96,165,250,.15)',electrical:'rgba(242,139,130,.15)',chiller:'rgba(100,200,255,.15)',bobst:'rgba(37,211,102,.2)',motors:'rgba(251,146,60,.15)',mechanical:'rgba(192,132,252,.15)',network:'rgba(30,184,208,.15)',safety_hw:'rgba(242,139,130,.15)',hmi:'rgba(37,211,102,.15)',misc:'rgba(128,128,128,.1)'};
  g.innerHTML=items.map(function(m){
    var bg=colorMap[m.cat]||'rgba(128,128,128,.1)';
    return '<div class="man-item" onclick="openPDF(\''+m.file.replace(/'/g,"\\'")+'\',\''+m.name.replace(/'/g,"\\'")+'\')"><div class="man-ico" style="background:'+bg+'">'+m.ico+'</div><div class="man-info"><div class="man-name">'+escH(m.name)+'</div><div class="man-vendor">'+escH(m.vendor)+'</div><span class="man-type '+typeClass[m.type]+'">'+typeMap[m.type]+'</span></div></div>';
  }).join('');
}

