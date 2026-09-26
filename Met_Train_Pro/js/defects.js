// Met Train PRO — Defects, Met & Slit operations
// ══════════════════════════════════════════════════════
// DEFECT ACTION PLANS — Dedicated Section
// ══════════════════════════════════════════════════════
// ═══ BUDGET TEMPLATE DOWNLOAD (SheetJS → .xlsx) ═══
function downloadBudget(type){
  if(typeof XLSX==='undefined'){alert('SheetJS library not loaded. Check internet connection.');return;}
  var wb=XLSX.utils.book_new();

  if(type==='simple'){
    var data=[];
    data.push(['ANNUAL MAINTENANCE BUDGET \u2014 VACUUM METALLISER (BOBST K5)']);
    data.push(['Company: _______________  |  FY: _________  |  Machine: _______________']);
    data.push([]);
    data.push(['Sr.','Item Description','Specification','UOM','Qty/Year','Rate (\u20b9)','Amount (\u20b9)','Actual Last FY','Remarks']);
    var secs=[
      {t:'A. CONSUMABLES \u2014 EVAPORATION',items:[
        ['Ceramic Boats (BN/TiB\u2082)','OEM approved','Nos',500,850,'','Boat life 8-24 hrs'],
        ['Al Wire 1.5mm (99.99%)','4N purity','Kg',12000,280,'','~1000 kg/month'],
        ['Al Wire 2.0mm (99.99%)','AlBond/high OD','Kg',3000,290,'','AlBond products'],
        ['Graphite Tape','Boat-copper contact','Rolls',24,450,'','2 rolls/month'],
        ['Boron Nitride Spray','Shield release','Cans',36,1200,'','3 cans/month'],
        ['Wire Feeder Springs','Pressure roller','Sets',24,350,'','Monthly replacement!'],
        ['Wire Feeder Spouts','Guide nozzle','Nos',48,280,'','Monthly replacement'],
        ['Wire Feeder Drive Wheels','Grooved 3-position','Nos',8,1800,'','Replace when worn']]},
      {t:'B. VACUUM SYSTEM',items:[
        ['O-Rings \u2014 Chamber Door','Viton','Nos',12,3500,'','Check every cycle'],
        ['O-Rings \u2014 Window/Port','Various','Set',12,1500,'','Monthly inspect'],
        ['Vacuum Grease (Silicone)','Dow Corning','Tubes',12,800,'','O-ring lube only'],
        ['Cobra Pump Oil VE 101','ISO-VG 100','L',8,2200,'','5000 hrs interval'],
        ['Cobra Cooling Liquid C-25','40% glycol','L',60,180,'','Annual change'],
        ['Aerzen Oil Anderol 555','Synthetic','L',8,3500,'','5000 hrs interval'],
        ['DP Oil CVC Silicone 4','High vacuum','L',10,8500,'','Annual change'],
        ['Cobra Inlet Filter','Replacement','Nos',4,4500,'','Quarterly'],
        ['Exhaust Atomuffler','Oil mist filter','Nos',4,3200,'','Quarterly']]},
      {t:'C. COOLING SYSTEM',items:[
        ['Ethylene Glycol','Coolant','L',50,220,'','SG 1.080'],
        ['Y-Strainer Mesh Screen','Water filter','Nos',4,650,'','Clean monthly!'],
        ['Refrigerant R407C/R410A','Top-up','Kg',5,1800,'','If leak'],
        ['Cooling Tower Chemicals','Treatment','Lot',12,3500,'','Monthly'],
        ['Deublin Rotary Union Kit','Drum seal','Kit',2,12000,'','On leak']]},
      {t:'D. WINDING SYSTEM',items:[
        ['Spreader Rubber Sleeve','Bow roller','Nos',4,8500,'','When worn'],
        ['Nip Roller Re-rubber','Rewind nip','Nos',2,15000,'','Annual'],
        ['Svecom Shaft Parts','Springs/keys','Set',2,5500,'','Shaft service'],
        ['ETP Coupling Elements','Spider/insert','Nos',4,3800,'','On inspection']]},
      {t:'E. ELECTRICAL & DRIVES',items:[
        ['Semiconductor Fuses','Drive protection','Nos',20,2500,'','Critical!'],
        ['Fuses HRC/MCB','Panel','Nos',30,150,'','Various'],
        ['Contactors / Relays','LC1/LR2','Nos',10,1200,'','On failure'],
        ['Proximity Sensors IFM','M12/M18','Nos',10,1800,'','On failure'],
        ['Flow Sensors SM6004','Cooling water','Nos',2,12000,'','On failure'],
        ['Profibus Connectors','DB9','Nos',10,850,'','Keep spare'],
        ['Encoder','Drive feedback','Nos',2,18000,'','Keep 1 spare'],
        ['Stogra SERS Stepper','Wire feeder','Nos',1,35000,'','Long lead']]},
      {t:'F. MECHANICAL SPARES',items:[
        ['Bearings Deep Groove','SKF','Nos',20,800,'','Per schedule'],
        ['Bearings Roller/CARB','Heavy duty','Nos',4,4500,'','Drum/main'],
        ['SKF Grease LGMT2','EP grease','Kg',5,650,'','Per lube schedule'],
        ['Timing Belts','Various','Nos',6,2200,'','On inspection'],
        ['Pneumatic Cylinders','Festo','Nos',4,5500,'','Shutter/shield'],
        ['Solenoid Valves','5/2 3/2','Nos',6,3500,'','On failure']]},
      {t:'G. OEM SERVICE & AMC',items:[
        ['Cobra Annual Service','Inspect+oil','Visit',2,85000,'','2 machines'],
        ['Cobra Major Overhaul','16000h provision','Prov',1,125000,'','Pro-rata'],
        ['Aerzen Service','Oil+inspect','Visit',2,45000,'','2 machines'],
        ['Polycold Inspection','He leak+comp','Visit',2,55000,'','Specialist'],
        ['BOBST Annual Visit','OEM engineer','Visit',1,150000,'','Full inspect'],
        ['Chiller Service','Refrigeration','Visit',2,35000,'','2 machines'],
        ['He Leak Detection','Fine leak','Visit',2,25000,'','As needed']]},
      {t:'H. SAFETY & PPE',items:[
        ['P3 Respirator Masks','AlBond/chamber','Nos',100,120,'','Mandatory'],
        ['Safety Glasses','ANSI Z87.1','Nos',24,350,'','Replace scratched'],
        ['Heat Gloves','Boat handling','Pairs',24,280,'','Monthly'],
        ['Safety Shoes','Steel toe ESD','Pairs',12,1800,'','Annual'],
        ['Fire Ext Service','ABC+CO2+ClassD','Lot',1,15000,'','Annual']]},
      {t:'I. CALIBRATION',items:[
        ['Hawkeye Standards','OD reference','Set',1,25000,'','Annual'],
        ['Dyne Pen Set','38-44 dyne','Set',12,850,'','Monthly'],
        ['Gauge Calibration','Vacuum+process','Lot',1,12000,'','NABL'],
        ['Earth Pit Test','Resistance','Lot',1,8000,'','IE Rules'],
        ['Thermography','IR panels','Visit',1,20000,'','Annual PdM']]},
      {t:'J. CLEANING',items:[
        ['IPA','Roller/optics','L',50,180,'','Lint-free+IPA'],
        ['Lint-Free Cloths','Vacuum/optics','Box',24,350,'','Never regular!'],
        ['Vacuum Bags','Dust rated','Nos',24,280,'','Every cycle'],
        ['Contact Cleaner','Connectors','Cans',12,350,'','Quarterly']]},
      {t:'K. MISCELLANEOUS',items:[
        ['Signage & Labels','Safety signs','Lot',1,5000,'','Replace faded'],
        ['Logbooks','PM/shift logs','Lot',1,3000,'','Annual'],
        ['Training Material','Manuals','Lot',1,10000,'','Development'],
        ['Contingency 5%','Emergency','Lot',1,'','','5% of subtotal']]}
    ];
    var sr=1;
    for(var s=0;s<secs.length;s++){
      data.push([secs[s].t,'','','','','','','','']);
      for(var i=0;i<secs[s].items.length;i++){
        var it=secs[s].items[i];
        var amt=(typeof it[3]==='number'&&typeof it[4]==='number')?it[3]*it[4]:'';
        data.push([sr,it[0],it[1],it[2],it[3],it[4],amt,'',it[6]]);
        sr++;
      }
      data.push(['','SUBTOTAL \u2014 '+secs[s].t.split('.')[0].trim(),'','','','','','','']);
    }
    data.push([]);
    data.push(['\u2605','GRAND TOTAL','','','','','','','']);
    data.push([]);
    data.push(['','Cost per Machine (\u00f72)','','','','','','','']);
    data.push(['','Cost per Month (\u00f712)','','','','','','','']);
    data.push([]);
    data.push(['NOTES: Blue = Input. Fill Qty & Rate. Amount = Qty x Rate. All in \u20b9.']);
    data.push(['Prepared: _________ | Reviewed: _________ | Approved: _________ | Date: _________']);
    var ws=XLSX.utils.aoa_to_sheet(data);
    ws['!cols']=[{wch:6},{wch:36},{wch:20},{wch:8},{wch:10},{wch:11},{wch:13},{wch:13},{wch:30}];
    XLSX.utils.book_append_sheet(wb,ws,'Annual Budget');
    // Summary
    var sum=[['BUDGET SUMMARY'],[],['Sr.','Category','Budget (\u20b9)','Actual Last FY','% of Total']];
    var cn=['A. Consumables','B. Vacuum System','C. Cooling','D. Winding','E. Electrical','F. Mechanical','G. OEM Services','H. Safety','I. Calibration','J. Cleaning','K. Miscellaneous'];
    for(var i=0;i<cn.length;i++) sum.push([i+1,cn[i],'','','']);
    sum.push(['\u2605','GRAND TOTAL','','','']);
    var ws2=XLSX.utils.aoa_to_sheet(sum);
    ws2['!cols']=[{wch:6},{wch:28},{wch:15},{wch:15},{wch:12}];
    XLSX.utils.book_append_sheet(wb,ws2,'Summary');

  } else {
    // DETAILED: 10 sheets
    var s1=[['Spare - Consumables, Routine Repair & One Time Budget'],[],['Deptt:','METALLISER','FY:','________'],[],
      ['S.No.','Particulars','Proposed (\u20b9 Lakhs)','Actual Last FY','Variance','Remarks'],
      [1,'Consumables','','','','Process consumables'],[2,'Lub & Oils','','','','PM + Annual DP'],[3,'Essential Spares','','','','Breakdown prevention'],
      [4,'Services','','','','OEM + ad-hoc'],[5,'Repair Job Work','','','','External vendors'],[6,'E&I Spares','','','','Drives/PLC/Sensors'],
      [7,'Stationery','','','','Logbooks/office'],['A','Sub Total (Routine)','','','',''],
      [8,'Emergency Spares','','','','Source box/pumps'],['B','Sub Total (Emergency)','','','',''],
      ['A+B','Sub Total','','','',''],['','Budget per Month','','','','= Total/12'],
      [9,'Upgradation & Modification','','','',''],['','Grand Total','','','',''],['','Grand Budget/Month','','','','= Grand/12'],
      [],['*','Crane/AMC not included'],['Note:','All values in Lakhs. Blue = Input.'],['\u00a9 VKS TECH \u2014 Vacuum Metallisation Knowledge Platform']];
    var w1=XLSX.utils.aoa_to_sheet(s1);w1['!cols']=[{wch:8},{wch:55},{wch:18},{wch:16},{wch:14},{wch:35}];
    XLSX.utils.book_append_sheet(wb,w1,'Budget - Summary');

    var s2=[['Shutdown Planning'],[],['Sl.No','Machine','Activity','SD Date','Spare Status','SD Days','Approval','Cost (Lakhs)','Actual Days','Deviation','PR/PO']];
    var ms=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    for(var m=0;m<ms.length;m++){s2.push(['MET \u2014 '+ms[m]]);for(var j=1;j<=5;j++)s2.push([j,'','','','','','','','','','']);}
    var w2=XLSX.utils.aoa_to_sheet(s2);w2['!cols']=[{wch:7},{wch:14},{wch:42},{wch:12},{wch:16},{wch:10},{wch:12},{wch:13},{wch:10},{wch:20},{wch:28}];
    XLSX.utils.book_append_sheet(wb,w2,'SD Planner');

    var s3=[['Budget Detail \u2014 MECH/E&I Split'],[],['S.No.','Description','Machine','Cost (Lakhs)','Justification','Category','Dept','20% Hike']];
    var bi=['Compressor Spares|MECH','Polycold Spares|MECH','Vacuum Pump Spares|MECH','Lub & Oil|MECH','Process Consumables|PROD','Shaft Maintenance|MECH',
      'Roller Re-rubber|MECH','Nip Roller|MECH','Bearings|MECH','Belts|MECH','Mech Spares (Pumps/Valves)|MECH',
      'E&I Spares (Drives/PLC)|E&I','Wire Feeder Cards|E&I','Sensors|E&I','Cables|E&I','Source Evaporator|MECH','Rotary Pump Standby|MECH'];
    for(var i=0;i<bi.length;i++){var p=bi[i].split('|');s3.push([i+1,p[0],'All','','','',p[1],'']);}
    var w3=XLSX.utils.aoa_to_sheet(s3);w3['!cols']=[{wch:6},{wch:45},{wch:10},{wch:13},{wch:38},{wch:15},{wch:10},{wch:13}];
    XLSX.utils.book_append_sheet(wb,w3,'Budget Detail');

    var s4=[['Process Consumables'],[],['Dept','M/C','S.No.','Material Code','Description','UoM','Category','Value (Lakhs)','Qty','Cost/MT']];
    var pc=['Copper Clamp 50x50x135mm','Copper Clamp 50x50x35mm','Copper Sq Bolt 45x38mm','Copper Sq Bolt 45x88mm','Bolt with Shoulder','Paper Masking Tape 36mm','Cork Tape 31m x 75mm','Cork Tape 50mm x 50m','Emery Paper Set','Scotch Brite Pad','Glass Fabric','Fibre Glass Tape','Molykote 1000','3M Alnox Compound'];
    for(var i=0;i<pc.length;i++)s4.push(['PROD','All',i+1,'',pc[i],'PCS','CONSUMABLE','','','']);
    s4.push([]);s4.push(['','Total','','','','','','','','']);
    var w4=XLSX.utils.aoa_to_sheet(s4);w4['!cols']=[{wch:7},{wch:8},{wch:6},{wch:18},{wch:40},{wch:7},{wch:14},{wch:14},{wch:8},{wch:10}];
    XLSX.utils.book_append_sheet(wb,w4,'Process Consumable');

    var s5=[['E&I Spares'],[],['Material Code','Description','UoM','Min Stock','Order Qty','Unit Rate','Total Cost']];
    var ei=['MFC O2 3000SCCM','MFC Air 200000SCCM','Wire Feeder Module','DP Oil Thermostat','PU Tube 8mm','PU Tube 10mm','Push Fit Fittings','SOV Coil 24VDC',
      'Fuse HN 63A','Vacuum Gauge Inficon','PLC Card B&R/Beckhoff','Thyristor Thyro-A','Contactor 3RT Siemens','DP Heater 2kW',
      'Light Barrier TX+RX','Cooling Fan EBM','MPCB 26-32A','Maxcool Polycold E-Box','Ceramic Induction Coil'];
    for(var i=0;i<ei.length;i++)s5.push(['',ei[i],'PCS','','','','']);
    s5.push([]);s5.push(['','TOTAL','','','','','']);
    var w5=XLSX.utils.aoa_to_sheet(s5);w5['!cols']=[{wch:18},{wch:42},{wch:7},{wch:10},{wch:10},{wch:13},{wch:13}];
    XLSX.utils.book_append_sheet(wb,w5,'E&I Spares');

    var s6=[['Justification \u2014 Essential Spares'],[],['Type','S.No.','Item','Cost (Lakhs)','Reason','Machine','Remaining Life','Repairable?','New Life','Schedule','Annexure']];
    var es=['General Vacuum Spares','Copper Clamps','Coating Window Gear Box','Drives/PLC','Thyristors/SCR','Mechanical Spares','Bearings','Oil Seal/O-Ring','MFC/Controllers','Belts','Vacuum Gauges','Shield/Shutter','Chuck Spares','Polycold Gas','Couplings/Valves','DP Heaters'];
    for(var i=0;i<es.length;i++)s6.push(['Essential',i+1,es[i],'','Reduce D/T','All','','','','','']);
    s6.push([]);s6.push(['','','TOTAL','']);
    var w6=XLSX.utils.aoa_to_sheet(s6);w6['!cols']=[{wch:11},{wch:6},{wch:35},{wch:12},{wch:35},{wch:12},{wch:13},{wch:11},{wch:10},{wch:10},{wch:10}];
    XLSX.utils.book_append_sheet(wb,w6,'Justification Essential');

    var s7=[['Justification \u2014 Emergency Spares'],[],['Type','S.No.','Item','Cost (Lakhs)','Reason','Machine','Repairable?','New Life','Schedule']];
    var em=[['Source Evaporator Frame','Machine stop risk','Metalliser-1/2'],['Strobe Window Flap','Extended BD','All'],['Evaporation Bushings','OEM unique','All'],
      ['UW/RW Housing','Usage damage','All'],['Rubber Expander Bow','Prevent BD','All'],['H&C Circ Pump','CPP/OPP critical','All'],
      ['Rotary Pump Standby','Vacuum improve','All'],['Drum Shield Complete','Stop if damaged','All']];
    for(var i=0;i<em.length;i++)s7.push(['Emergency',i+1,em[i][0],'',em[i][1],em[i][2],'','','']);
    s7.push([]);s7.push(['','','TOTAL','']);
    var w7=XLSX.utils.aoa_to_sheet(s7);w7['!cols']=[{wch:11},{wch:6},{wch:35},{wch:12},{wch:35},{wch:12},{wch:11},{wch:10},{wch:10}];
    XLSX.utils.book_append_sheet(wb,w7,'Justification Emergency');

    var s8=[['Actual Expenses \u2014 Paste from SAP/ERP'],[],['Cost Centre','Item Code','Description','Qty','UoM','Value (\u20b9)','Mat Group','Remark','Type','Location','HEAD']];
    s8.push(['\u2190 Paste SAP data here']);
    var w8=XLSX.utils.aoa_to_sheet(s8);w8['!cols']=[{wch:20},{wch:18},{wch:42},{wch:7},{wch:7},{wch:13},{wch:13},{wch:18},{wch:10},{wch:13},{wch:15}];
    XLSX.utils.book_append_sheet(wb,w8,'Actual Expenses');

    var s9=[['Services & Job Work'],[],['Month','Cost Centre','Item Code','Description','UoM','Qty','Value (\u20b9)','Category']];
    var w9=XLSX.utils.aoa_to_sheet(s9);w9['!cols']=[{wch:10},{wch:20},{wch:16},{wch:45},{wch:7},{wch:7},{wch:13},{wch:15}];
    XLSX.utils.book_append_sheet(wb,w9,'Services - Job Work');

    var s10=[['Actual vs Proposed'],[],['Particulars','Actual (\u20b9 Lakhs)','Additional','Total Proposed']];
    var ct=['SPARES','METALIZER','MTZ-OTH','OIL','MECH','CONSUMABLE','ESSENTIAL','EMERGENCY','CRITICAL','BEARING','TOOLS','ELECT','LUBRICANT','BELT','STATIONERY','INSTT'];
    for(var i=0;i<ct.length;i++)s10.push([ct[i],'','','']);
    s10.push([]);s10.push(['Total','','','']);
    var d10=XLSX.utils.aoa_to_sheet(s10);d10['!cols']=[{wch:35},{wch:22},{wch:18},{wch:22}];
    XLSX.utils.book_append_sheet(wb,d10,'Actual vs Proposal');
  }

  var fname='Metalliser_Budget_'+(type==='simple'?'Simple':'Detailed')+'_Format.xlsx';
  XLSX.writeFile(wb,fname);
  var msgs=document.getElementById('ai-msgs');
  if(msgs){
    var msg='\u2705 **Excel File Downloaded!**\n\n\ud83d\udcc2 **'+fname+'**\n\n'+(type==='simple'?'\ud83d\udcca 2 Sheets: Annual Budget (75+ items) + Summary\n11 Categories with Spec, UOM, Qty, Rate':'\ud83d\udcca 10 Sheets: Summary, SD Planner, Budget Detail, Process Consumable, E&I Spares, Justification Essential, Justification Emergency, Actual Expenses, Services, Actual vs Proposal')+'\n\n\u270f\ufe0f Open in Excel \u2192 Fill values \u2192 Ready!';
    _aiHistory.push({role:'assistant',content:msg});
    msgs.innerHTML+='<div class="ai-msg ai-bot"><div class="ai-avatar">\ud83e\udd16</div><div class="ai-bubble ai-bubble-bot">'+formatAIReply(msg)+'</div></div>';
    msgs.scrollTop=msgs.scrollHeight;
  }
}



// ═══ FORMAT DOCUMENT DOWNLOAD (Hindi + English) ═══
var FMT_DOCS={
'F01':{
  en:{t:'Metallizer Log Book',no:'MET/F/01',
    h:'<table><tr><th>Cycle No</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th></tr><tr><td>Roll Setup (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Vacuum + Heating (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Roll Running (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Vent (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Down Time (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><b>Total (Min)</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>Production Planning</b><table><tr><th>S.No.</th><th>Material</th><th>Width</th><th>No. of Rolls</th><th>Optical Density</th><th>Remark</th></tr><tr><td>1</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>5</td><td></td><td></td><td></td><td></td><td></td></tr></table>'},
  hi:{t:'मेटलाइज़र लॉग बुक',no:'MET/F/01',
    h:'<table><tr><th>साइकिल नं.</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th></tr><tr><td>रोल सेटअप (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>वैक्यूम + हीटिंग (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>रोल रनिंग (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>वेंट (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>डाउन टाइम (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><b>कुल (मिनट)</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>उत्पादन योजना</b><table><tr><th>क्र.सं.</th><th>सामग्री</th><th>चौड़ाई</th><th>रोल संख्या</th><th>ऑप्टिकल डेंसिटी</th><th>टिप्पणी</th></tr><tr><td>1</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>5</td><td></td><td></td><td></td><td></td><td></td></tr></table>'}
},
'F02':{
  en:{t:'Met Slitter Log Book',no:'MET/F/02',
    h:'<b>Input Details</b><table><tr><th>Material</th><th>Bare Jumbo No.</th><th>Met Jumbo No.</th><th>Width (MM)</th><th>Length (MTR)</th><th>Weight (KGS)</th></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>Output Details</b><table><tr><th>Batch No.</th><th>Width (MM)</th><th>Length (MTR)</th><th>Core ID</th><th>Roll Pos.</th><th>Joint</th><th>Met Side</th><th>Gross Wt</th><th>Net Wt</th><th>Grade</th><th>Remarks</th></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>Time Tracking</b><table><tr><th>S.No.</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th></tr><tr><td>Setup (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Running (Min)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Avg Speed</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Downtime</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><b>Total</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Met Waste (Kg)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Bare Waste (Kg)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>'},
  hi:{t:'मेट स्लिटर लॉग बुक',no:'MET/F/02',
    h:'<b>इनपुट विवरण</b><table><tr><th>सामग्री</th><th>बेयर जंबो नं.</th><th>मेट जंबो नं.</th><th>चौड़ाई (MM)</th><th>लंबाई (MTR)</th><th>वज़न (KGS)</th></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>आउटपुट विवरण</b><table><tr><th>बैच नं.</th><th>चौड़ाई</th><th>लंबाई</th><th>कोर ID</th><th>रोल पोज़.</th><th>जोड़</th><th>मेट साइड</th><th>ग्रॉस वज़न</th><th>नेट वज़न</th><th>ग्रेड</th><th>टिप्पणी</th></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>समय ट्रैकिंग</b><table><tr><th>क्र.सं.</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th></tr><tr><td>सेटअप (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>रनिंग (मिनट)</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>औसत गति</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>डाउनटाइम</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><b>कुल</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>'}
},
'F07':{
  en:{t:'Daily PM Checklist (21 Points)',no:'MET/F/07',
    h:'<table><tr><th>S.No.</th><th>Assembly</th><th>Task</th><th>D-1</th><th>D-2</th><th>D-3</th><th>D-4</th><th>D-5</th></tr><tr><td>1</td><td>Mech Booster Pumps</td><td>Check oil level on gear case end</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td>Mech Booster Pumps</td><td>Check oil level on drive case end</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td>Mech Booster Pumps</td><td>Check water line leaks on drive motor case</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4</td><td>Mech Booster Pumps</td><td>Check CM2000 inlet filter, clean per manual</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>5</td><td>Vacuum O-Rings</td><td>Check main faceplate-chamber O-ring damage</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>6</td><td>GRE Chiller (48-96KW)</td><td>External water leak check</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>7</td><td>GRE Chiller (48-96KW)</td><td>Abnormal operation noise check</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>8</td><td>Drum Shield/Zone Seal</td><td>Apply release paint on seals around source</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>9</td><td>Plasma Treater Gas</td><td>Gas bottle regulator <2 bar (30 Psi)</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>10</td><td>Machine Water</td><td>Check all manifolds & rubber hose leaks</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>11</td><td>Winding Cart Leadthrough</td><td>Visual check gravity oil bottles</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>12</td><td>Winding Cart Leadthrough</td><td>Check gravity oil lines for leaks</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>13</td><td>Hawkeye OD Monitor</td><td>Check substrate debris between probes</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>14</td><td>Hawkeye OD Monitor</td><td>Clean stray light deflector</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>15-21</td><td>Cleaning (7 areas)</td><td>Bearing housings, Pump side, Winding cart, Web rollers, DP pit, VV7 section, Drum shields — ALL dust-free</td><td></td><td></td><td></td><td></td><td></td></tr></table>'},
  hi:{t:'दैनिक PM चेकलिस्ट (21 बिंदु)',no:'MET/F/07',
    h:'<table><tr><th>क्र.सं.</th><th>असेम्बली</th><th>कार्य</th><th>दि-1</th><th>दि-2</th><th>दि-3</th><th>दि-4</th><th>दि-5</th></tr><tr><td>1</td><td>मैकेनिकल बूस्टर पंप</td><td>गियर केस सिरे पर तेल स्तर जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td>मैकेनिकल बूस्टर पंप</td><td>ड्राइव केस सिरे पर तेल स्तर जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td>मैकेनिकल बूस्टर पंप</td><td>ड्राइव मोटर केस पर जल रिसाव जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4</td><td>मैकेनिकल बूस्टर पंप</td><td>CM2000 इनलेट फिल्टर जांचें और साफ करें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>5</td><td>वैक्यूम O-रिंग</td><td>फेसप्लेट से चैम्बर O-रिंग क्षति जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>6</td><td>GRE चिलर</td><td>बाहरी जल रिसाव जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>7</td><td>GRE चिलर</td><td>असामान्य शोर जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>8</td><td>ड्रम शील्ड/ज़ोन सील</td><td>सील पर रिलीज़ पेंट लगाएं</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>9</td><td>प्लाज़्मा ट्रीटर गैस</td><td>रेगुलेटर दबाव <2 बार जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>10</td><td>मशीन वाटर</td><td>सभी मैनिफोल्ड और होज़ रिसाव जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>11-12</td><td>वाइंडिंग कार्ट</td><td>ग्रेविटी ऑयल बॉटल और लाइन जांचें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>13-14</td><td>हॉकआई मॉनिटर</td><td>प्रोब में मलबा जांचें और डिफ्लेक्टर साफ करें</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>15-21</td><td>सफाई (7 क्षेत्र)</td><td>बेयरिंग हाउसिंग, पंप साइड, वाइंडिंग कार्ट, वेब रोलर, DP पिट, VV7 सेक्शन, ड्रम शील्ड — सब धूल-मुक्त</td><td></td><td></td><td></td><td></td><td></td></tr></table>'}
},
'FPRD07':{
  en:{t:'Metallised Roll Job Card',no:'F/PRD/07',
    h:'<p><b>Machine:</b> _____________ &nbsp;&nbsp; <b>Date:</b> _____________ &nbsp;&nbsp; <b>Shift:</b> _______</p><table><tr><th colspan="2">INPUT (Unmetallized)</th><th colspan="2">OUTPUT (Metallized)</th></tr><tr><td>Film Type</td><td style="width:150px"></td><td>Met Roll No.</td><td style="width:150px"></td></tr><tr><td>Roll No.</td><td></td><td>Optical Density</td><td></td></tr><tr><td>Thickness (\\u00b5m)</td><td></td><td>Length (m)</td><td></td></tr><tr><td>Width (mm)</td><td></td><td>Weight (kg)</td><td></td></tr><tr><td>Length (m)</td><td></td><td>No. of Web Breaks</td><td></td></tr><tr><td>Gross Weight (kg)</td><td></td><td rowspan="2"><b>Remarks:</b></td><td rowspan="2"></td></tr><tr><td>No. of Joints</td><td></td></tr></table><p style="text-align:right"><b>Shift Operator:</b> _________________</p>'},
  hi:{t:'मेटलाइज़्ड रोल जॉब कार्ड',no:'F/PRD/07',
    h:'<p><b>मशीन:</b> _____________ &nbsp;&nbsp; <b>दिनांक:</b> _____________ &nbsp;&nbsp; <b>शिफ्ट:</b> _______</p><table><tr><th colspan="2">इनपुट (अनमेटलाइज़्ड)</th><th colspan="2">आउटपुट (मेटलाइज़्ड)</th></tr><tr><td>फिल्म प्रकार</td><td style="width:150px"></td><td>मेट रोल नं.</td><td style="width:150px"></td></tr><tr><td>रोल नं.</td><td></td><td>ऑप्टिकल डेंसिटी</td><td></td></tr><tr><td>मोटाई (\\u00b5m)</td><td></td><td>लंबाई (m)</td><td></td></tr><tr><td>चौड़ाई (mm)</td><td></td><td>वज़न (kg)</td><td></td></tr><tr><td>लंबाई (m)</td><td></td><td>वेब ब्रेक संख्या</td><td></td></tr><tr><td>ग्रॉस वज़न (kg)</td><td></td><td rowspan="2"><b>टिप्पणी:</b></td><td rowspan="2"></td></tr><tr><td>जोड़ संख्या</td><td></td></tr></table><p style="text-align:right"><b>शिफ्ट ऑपरेटर:</b> _________________</p>'}
},
'GMP10':{
  en:{t:'Personal Hygiene Checklist',no:'GMP/F/10',
    h:'<p><b>Date:</b> _________ &nbsp;&nbsp; <b>Observer:</b> _________ &nbsp;&nbsp; <b>Person:</b> _________</p><table><tr><th>S.No.</th><th>Checkpoint</th><th>Yes</th><th>No</th><th>Corrective Action</th></tr><tr><td>1</td><td>Clean uniform + safety shoes worn</td><td></td><td></td><td></td></tr><tr><td>2</td><td>Hair properly covered with cap</td><td></td><td></td><td></td></tr><tr><td>3</td><td>Fingernails short, unpolished, clean (no artificial)</td><td></td><td></td><td></td></tr><tr><td>4</td><td>No jewellery in plant area</td><td></td><td></td><td></td></tr><tr><td>5</td><td>Hands washed properly & frequently</td><td></td><td></td><td></td></tr><tr><td>6</td><td>Burns/wounds bandaged + food-grade glove</td><td></td><td></td><td></td></tr><tr><td>7</td><td>No eating/drinking/smoking/tobacco in plant</td><td></td><td></td><td></td></tr><tr><td>8</td><td>Personal hanky for coughing/sneezing + hand wash</td><td></td><td></td><td></td></tr><tr><td>9</td><td>Hand sinks unobstructed, clean, stocked with soap</td><td></td><td></td><td></td></tr><tr><td>10</td><td>Employee lockers operational and clean</td><td></td><td></td><td></td></tr></table><p><b>Remarks:</b> _______________________________________________</p>'},
  hi:{t:'पर्सनल हाइजीन चेकलिस्ट',no:'GMP/F/10',
    h:'<p><b>दिनांक:</b> _________ &nbsp;&nbsp; <b>निरीक्षक:</b> _________ &nbsp;&nbsp; <b>व्यक्ति:</b> _________</p><table><tr><th>क्र.सं.</th><th>जांच बिंदु</th><th>हां</th><th>नहीं</th><th>सुधारात्मक कार्रवाई</th></tr><tr><td>1</td><td>साफ यूनिफॉर्म + सेफ्टी शूज़ पहने हैं</td><td></td><td></td><td></td></tr><tr><td>2</td><td>बाल ठीक से कैप से ढके हैं</td><td></td><td></td><td></td></tr><tr><td>3</td><td>नाखून छोटे, बिना पॉलिश, साफ</td><td></td><td></td><td></td></tr><tr><td>4</td><td>प्लांट एरिया में कोई आभूषण नहीं</td><td></td><td></td><td></td></tr><tr><td>5</td><td>हाथ सही तरह से और बार-बार धोए</td><td></td><td></td><td></td></tr><tr><td>6</td><td>जलन/घाव पर पट्टी + फूड-ग्रेड दस्ताने</td><td></td><td></td><td></td></tr><tr><td>7</td><td>प्लांट में खाना/पीना/धूम्रपान/तम्बाकू नहीं</td><td></td><td></td><td></td></tr><tr><td>8</td><td>खांसी/छींक के लिए रूमाल + हाथ धोना</td><td></td><td></td><td></td></tr><tr><td>9</td><td>हैंड सिंक साफ, साबुन से भरे</td><td></td><td></td><td></td></tr><tr><td>10</td><td>कर्मचारी लॉकर साफ और कार्यरत</td><td></td><td></td><td></td></tr></table><p><b>टिप्पणी:</b> _______________________________________________</p>'}
},
'F06':{
  en:{t:'Boats Life Testing Format',no:'MET/F/06',
    h:'<b>1. General Information</b><table><tr><td><b>Date</b></td><td></td><td><b>Plant</b></td><td></td></tr><tr><td><b>Boats Position</b></td><td></td><td><b>Department</b></td><td>Metalliser</td></tr><tr><td><b>Trial No.</b></td><td></td><td><b>Machine</b></td><td></td></tr><tr><td><b>Operator</b></td><td></td><td><b>Supervisor</b></td><td></td></tr></table><br><b>2. Boat Details</b><table><tr><td><b>Supplier</b></td><td></td><td><b>Type (Mono/Di/Tri-Met)</b></td><td></td></tr><tr><td><b>Size (mm)</b></td><td></td><td><b>Material (BN-TiB\\u2082/BN-ZrB\\u2082)</b></td><td></td></tr><tr><td><b>Batch/Lot No.</b></td><td></td><td><b>New/Re-used</b></td><td></td></tr><tr><td><b>Resistivity (\\u03bcOhm-cm)</b></td><td colspan="3"></td></tr><tr><td><b>Visual Condition</b></td><td colspan="3"></td></tr></table><br><b>3. Process Parameters</b><table><tr><th>Cycle</th><th>Speed (M/Min)</th><th>Width</th><th>Wire Dia</th><th>Feed Rate</th><th>Current (A)</th><th>Power %</th><th>Vacuum (mbar)</th><th>OD</th><th>Run Time</th><th>Met Length</th><th>Remark</th></tr><tr><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>4. Quality:</b> Stability: ___  Uniformity: ___  Spitting: ___<br><b>5. Conclusion:</b> _______________'},
  hi:{t:'बोट लाइफ टेस्टिंग फॉर्मेट',no:'MET/F/06',
    h:'<b>1. सामान्य जानकारी</b><table><tr><td><b>दिनांक</b></td><td></td><td><b>प्लांट</b></td><td></td></tr><tr><td><b>बोट पोज़ीशन</b></td><td></td><td><b>विभाग</b></td><td>मेटलाइज़र</td></tr><tr><td><b>ट्रायल नं.</b></td><td></td><td><b>मशीन</b></td><td></td></tr><tr><td><b>ऑपरेटर</b></td><td></td><td><b>सुपरवाइज़र</b></td><td></td></tr></table><br><b>2. बोट विवरण</b><table><tr><td><b>सप्लायर</b></td><td></td><td><b>प्रकार (Mono/Di/Tri-Met)</b></td><td></td></tr><tr><td><b>आकार (mm)</b></td><td></td><td><b>सामग्री (BN-TiB\\u2082/BN-ZrB\\u2082)</b></td><td></td></tr><tr><td><b>बैच/लॉट नं.</b></td><td></td><td><b>नया/पुन:प्रयुक्त</b></td><td></td></tr><tr><td><b>प्रतिरोधकता (\\u03bcOhm-cm)</b></td><td colspan="3"></td></tr></table><br><b>3. प्रोसेस पैरामीटर</b><table><tr><th>साइकिल</th><th>गति</th><th>चौड़ाई</th><th>वायर</th><th>फीड दर</th><th>करंट</th><th>पावर%</th><th>वैक्यूम</th><th>OD</th><th>समय</th><th>लंबाई</th><th>टिप्पणी</th></tr><tr><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table><br><b>4. गुणवत्ता:</b> स्थिरता: ___ समानता: ___ स्पिटिंग: ___<br><b>5. निष्कर्ष:</b> _______________'}
},
'OIL':{
  en:{t:'Oil & Coolant Replacement Schedule',no:'MET/F/10-11',
    h:'<table><tr><th>S.No.</th><th>Equipment</th><th>Frequency</th><th>Oil/Coolant Type</th><th>Date-1</th><th>Next Due</th></tr><tr><td>1</td><td>Aerzen Mech. Booster</td><td>Annual</td><td>Anderol 555</td><td></td><td></td></tr><tr><td>2</td><td>Busch Cobra Pump (Oil)</td><td>Annual</td><td>Anderol 555</td><td></td><td></td></tr><tr><td>3</td><td>Busch Cobra (Coolant)</td><td>5000 Hrs</td><td>40% Glycol + 60% DM Water</td><td></td><td></td></tr><tr><td>4</td><td>Diffusion Pump</td><td>Annual</td><td>Bobst CVC Silicone 4</td><td></td><td></td></tr><tr><td>5</td><td>Winding Cart Gearbox</td><td>Annual</td><td>BP Energol GR-XP 220</td><td></td><td></td></tr><tr><td>6</td><td>Drum Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 10</td><td></td><td></td></tr><tr><td>7</td><td>DTR1 Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 10</td><td></td><td></td></tr><tr><td>8</td><td>UW Chuck Gravity Bottle</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>9</td><td>Draw Gravity Bottle</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>10</td><td>RW Chuck Gravity Bottle</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>11</td><td>Draw Roller Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>12</td><td>DTR2 Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>13</td><td>Viewing Flap Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>14</td><td>Shutter Drive Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>15</td><td>VV7 Valve Leadthrough</td><td>Strip Down</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>16</td><td>Chiller Compressor</td><td>Strip Down</td><td>Polyolester ICI Emkarate 32</td><td></td><td></td></tr><tr><td>17</td><td>Brookes Maxcool Compressor</td><td>Strip Down</td><td>Solest LT-32</td><td></td><td></td></tr><tr><td>18</td><td>Lauda Refrigeration</td><td>Strip Down</td><td>Solest LT-32</td><td></td><td></td></tr></table>'},
  hi:{t:'तेल और कूलेंट बदलने का शेड्यूल',no:'MET/F/10-11',
    h:'<table><tr><th>क्र.सं.</th><th>उपकरण</th><th>अवधि</th><th>तेल/कूलेंट प्रकार</th><th>दिनांक-1</th><th>अगला</th></tr><tr><td>1</td><td>Aerzen बूस्टर</td><td>वार्षिक</td><td>Anderol 555</td><td></td><td></td></tr><tr><td>2</td><td>Busch Cobra (तेल)</td><td>वार्षिक</td><td>Anderol 555</td><td></td><td></td></tr><tr><td>3</td><td>Busch Cobra (कूलेंट)</td><td>5000 घंटे</td><td>40% ग्लाइकोल + 60% DM वाटर</td><td></td><td></td></tr><tr><td>4</td><td>डिफ्यूजन पंप</td><td>वार्षिक</td><td>Bobst CVC Silicone 4</td><td></td><td></td></tr><tr><td>5</td><td>वाइंडिंग कार्ट गियरबॉक्स</td><td>वार्षिक</td><td>BP Energol GR-XP 220</td><td></td><td></td></tr><tr><td>6-7</td><td>Drum/DTR1 Leadthrough</td><td>स्ट्रिप डाउन</td><td>Castrol Hyspin AWS 10</td><td></td><td></td></tr><tr><td>8-15</td><td>सभी अन्य Gravity Bottles</td><td>स्ट्रिप डाउन</td><td>Castrol Hyspin AWS 68</td><td></td><td></td></tr><tr><td>16</td><td>चिलर कंप्रेसर</td><td>स्ट्रिप डाउन</td><td>Polyolester ICI Emkarate 32</td><td></td><td></td></tr><tr><td>17-18</td><td>Maxcool/Lauda कंप्रेसर</td><td>स्ट्रिप डाउन</td><td>Solest LT-32</td><td></td><td></td></tr></table>'}
},
'F08':{
  en:{t:'Weekly PM Checklist (35 Points)',no:'MET/F/08',
    h:'<table><tr><th>S.No.</th><th>Assembly</th><th>Task</th><th>W1</th><th>W2</th><th>W3</th><th>W4</th></tr>'
    +'<tr><td>1</td><td>Varian Diffusion Pumps</td><td>Check all hoses for water leaks</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>2</td><td>Varian Diffusion Pumps</td><td>Check oil level & colour. Change dirty oil</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>3</td><td>Varian Diffusion Pumps</td><td>Fluid level at COLD/HOT marker</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>4</td><td>Vacuum O-Rings</td><td>Clean & re-grease faceplate-chamber O-ring</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>5</td><td>Cryo Maxcool Mk2</td><td>Check temperature during process, record LCD values</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>6</td><td>Cryo Maxcool Mk2</td><td>Check gas pressure & discharge, record LCD values</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>7</td><td>Vacuum System</td><td>Visual inspection for water leaks in chamber</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>8</td><td>Vacuum Chamber</td><td>Check all joint faces for damage, repair</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>9</td><td>Vacuum Chamber</td><td>Clean interior walls per operation manual</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>10</td><td>GRE Chiller</td><td>External water leak check</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>11</td><td>Viewing Flap</td><td>Check correct operation with spanner</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>12</td><td>Wire Feeder</td><td>Check clamp tightness</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>13</td><td>Wire Feeder</td><td>Check guide tube condition, replace if worn</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>14</td><td>Evaporation Source</td><td>General visual inspection after cleaning</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>15</td><td>Evaporation Source</td><td>Check evaporation shielding for damage</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>16</td><td>Evaporation Source</td><td>Check cooling lines & plugs for leaks</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>17</td><td>Evaporation Source</td><td>Check heat resistant hose covers</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>18</td><td>Evaporation Source</td><td>Torque copper clamps M8x90 = 25 NM</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>19</td><td>Winding Mechanism</td><td>Check rollers for damage, repair</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>20</td><td>Winding Mechanism</td><td>Ensure no debris around rollers</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>21</td><td>Winding Mechanism</td><td>Check rollers for corrosion, moisture</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>22</td><td>Winding Mechanism</td><td>Check rubber rollers for damage, stickiness</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>23</td><td>Winding Mechanism</td><td>Check slide rails, test movement both directions</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>24</td><td>Winding Mechanism</td><td>Check vacuum seal for oil leak signs</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>25</td><td>Winding Mechanism</td><td>Check drive roller oil leaks (affects vacuum)</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>26</td><td>Chucking System</td><td>Check gravity bottle to chuck oil leaks</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>27</td><td>Chucking System</td><td>Check core-in-location detector operation</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>28</td><td>Water Services</td><td>Check water supply system pressure differential</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>29</td><td>Spreader Roller</td><td>Check rubber sleeve for damage</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>30</td><td>Spreader Roller</td><td>Check apex position accuracy</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>31</td><td>Spreader Roller</td><td>Check position motor direction</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>32</td><td>Rotary Leadthrough</td><td>Check main shaft oil leak</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>33</td><td>Vacuum Gauges</td><td>Check all fittings tightness, clean area</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>34</td><td>Vacuum Chamber</td><td>Clean & lubricate winding mechanism O-ring</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>35</td><td>Vacuum Pipework</td><td>Fore-line bellow strainer check</td><td></td><td></td><td></td><td></td></tr>'
    +'</table>'},
  hi:{t:'साप्ताहिक PM चेकलिस्ट (35 बिंदु)',no:'MET/F/08',
    h:'<table><tr><th>क्र.</th><th>असेम्बली</th><th>कार्य</th><th>स1</th><th>स2</th><th>स3</th><th>स4</th></tr>'
    +'<tr><td>1</td><td>डिफ्यूजन पंप</td><td>सभी होज़ में जल रिसाव जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>2</td><td>डिफ्यूजन पंप</td><td>तेल स्तर और रंग जांचें, गंदा तेल बदलें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>3</td><td>डिफ्यूजन पंप</td><td>Fluid level COLD/HOT मार्कर पर जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>4</td><td>O-रिंग</td><td>फेसप्लेट O-रिंग साफ करें और ग्रीस लगाएं</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>5-6</td><td>क्रायो Maxcool</td><td>तापमान और गैस दबाव जांचें, LCD रिकॉर्ड करें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>7-9</td><td>वैक्यूम चैम्बर</td><td>जल रिसाव, जॉइंट डैमेज, दीवारें साफ करें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>10</td><td>GRE चिलर</td><td>बाहरी जल रिसाव जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>11</td><td>व्यूइंग फ्लैप</td><td>स्पैनर से सही संचालन जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>12-13</td><td>वायर फीडर</td><td>क्लैम्प टाइटनेस + गाइड ट्यूब स्थिति</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>14-18</td><td>इवैपोरेशन सोर्स</td><td>निरीक्षण, शील्डिंग, कूलिंग लाइन, होज़ कवर, कॉपर क्लैम्प टॉर्क 25NM</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>19-25</td><td>वाइंडिंग मैकेनिज्म</td><td>रोलर डैमेज, मलबा, जंग, रबर रोलर, स्लाइड रेल, वैक्यूम सील, ड्राइव तेल रिसाव</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>26-27</td><td>चकिंग सिस्टम</td><td>ग्रेविटी बॉटल तेल रिसाव + कोर डिटेक्टर</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>28</td><td>वाटर सर्विसेज</td><td>दबाव अंतर जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>29-31</td><td>स्प्रेडर रोलर</td><td>रबर स्लीव, एपेक्स पोज़ीशन, मोटर दिशा</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>32</td><td>रोटरी लीडथ्रू</td><td>शाफ्ट तेल रिसाव जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>33-35</td><td>वैक्यूम/पाइपवर्क</td><td>गेज फिटिंग, O-रिंग, फोर-लाइन बेलो स्ट्रेनर</td><td></td><td></td><td></td><td></td></tr>'
    +'</table>'}
},
'F09':{
  en:{t:'Monthly PM Checklist (42 Points)',no:'MET/F/09',
    h:'<table><tr><th>S.No.</th><th>Assembly</th><th>Task</th><th>M1</th><th>M2</th><th>M3</th></tr>'
    +'<tr><td>1-3</td><td>Diffusion Pumps</td><td>Fluid level COLD/HOT, external rust check, VV7 valve plates inspect & re-grease O-ring</td><td></td><td></td><td></td></tr>'
    +'<tr><td>4</td><td>Cryo Maxcool</td><td>Record cryo coil cooling time for comparison</td><td></td><td></td><td></td></tr>'
    +'<tr><td>5</td><td>Vacuum Chamber</td><td>Check all spool valve operations</td><td></td><td></td><td></td></tr>'
    +'<tr><td>6</td><td>Shield & Shutter</td><td>Check winch gearbox oil level — Anderol 555</td><td></td><td></td><td></td></tr>'
    +'<tr><td>7-12</td><td>Wire Feeder (6 items)</td><td>Drive wheel groove/clean, spring compression, spout clean (caustic soda), fasteners, bearing rotation, smooth rotation</td><td></td><td></td><td></td></tr>'
    +'<tr><td>13</td><td>Evaporation Source</td><td>Universal joint & rubber boot condition</td><td></td><td></td><td></td></tr>'
    +'<tr><td>14-15</td><td>Chucking System</td><td>Non-drive end oil level (top up/seal failure), external linear bearing clean</td><td></td><td></td><td></td></tr>'
    +'<tr><td>16-17</td><td>Electrical Panels/AC</td><td>Interior dust clean, external access panels clean</td><td></td><td></td><td></td></tr>'
    +'<tr><td>18-19</td><td>Plasma Treater</td><td>Insulation overheating check, plate wear from abrasion</td><td></td><td></td><td></td></tr>'
    +'<tr><td>20</td><td>Plasma Gas</td><td>Gas regulator within manufacturer life cycle</td><td></td><td></td><td></td></tr>'
    +'<tr><td>21</td><td>Spreader Roller</td><td>Check location fastener on roller</td><td></td><td></td><td></td></tr>'
    +'<tr><td>22</td><td>Isolation Valves</td><td>Grease rotary leadthroughs — Mobil SHC32</td><td></td><td></td><td></td></tr>'
    +'<tr><td>23</td><td>Shield & Shutter</td><td>Grease pivot bearings & winch shaft — Mobil SHC32</td><td></td><td></td><td></td></tr>'
    +'<tr><td>24-25</td><td>Chucking/Reel Shaft</td><td>External bearing grease + circlips, linear bearing grease</td><td></td><td></td><td></td></tr>'
    +'<tr><td>26</td><td>Gearboxes</td><td>Change oil/grease per manufacturer manual</td><td></td><td></td><td></td></tr>'
    +'<tr><td>27-29</td><td>Winding Mechanism</td><td>Kickert bearing grease, layarm cross drive grease, upper castor grease</td><td></td><td></td><td></td></tr>'
    +'<tr><td>30-31</td><td>Viewing Flap</td><td>Grease bearings + rotary pivot points both ends</td><td></td><td></td><td></td></tr>'
    +'<tr><td>32</td><td>Shield & Shutter</td><td>Grease shutter movement mechanism bearings</td><td></td><td></td><td></td></tr>'
    +'<tr><td>33-36</td><td>Winding Mechanism</td><td>Layarm linear bearings, spreader roller, layarm roller, load cell roller — grease both ends</td><td></td><td></td><td></td></tr>'
    +'<tr><td>37-40</td><td>Faceplate Bearings</td><td>Grease non-driven end: Process Drum, DTR2, DTR1, Draw Roller</td><td></td><td></td><td></td></tr>'
    +'<tr><td>41</td><td>Reel Shafts</td><td>Grease bearings (1-4) & support assembly both ends</td><td></td><td></td><td></td></tr>'
    +'<tr><td>42</td><td>Deublin Rotary Union</td><td>Remove excess grease from union (over-greasing indicator)</td><td></td><td></td><td></td></tr>'
    +'</table>'},
  hi:{t:'मासिक PM चेकलिस्ट (42 बिंदु)',no:'MET/F/09',
    h:'<table><tr><th>क्र.</th><th>असेम्बली</th><th>कार्य</th><th>मा1</th><th>मा2</th><th>मा3</th></tr>'
    +'<tr><td>1-3</td><td>डिफ्यूजन पंप</td><td>Fluid level, बाहरी जंग, VV7 वाल्व प्लेट निरीक्षण + O-रिंग ग्रीस</td><td></td><td></td><td></td></tr>'
    +'<tr><td>4</td><td>क्रायो Maxcool</td><td>क्रायो कॉइल कूलिंग समय रिकॉर्ड करें</td><td></td><td></td><td></td></tr>'
    +'<tr><td>5</td><td>वैक्यूम चैम्बर</td><td>सभी स्पूल वाल्व संचालन जांचें</td><td></td><td></td><td></td></tr>'
    +'<tr><td>6</td><td>शील्ड/शटर</td><td>विंच गियरबॉक्स तेल स्तर — Anderol 555</td><td></td><td></td><td></td></tr>'
    +'<tr><td>7-12</td><td>वायर फीडर (6 आइटम)</td><td>ड्राइव व्हील, स्प्रिंग, स्पाउट क्लीन, फास्टनर, बेयरिंग रोटेशन</td><td></td><td></td><td></td></tr>'
    +'<tr><td>13</td><td>इवैपोरेशन सोर्स</td><td>यूनिवर्सल जॉइंट और रबर बूट स्थिति</td><td></td><td></td><td></td></tr>'
    +'<tr><td>14-15</td><td>चकिंग सिस्टम</td><td>तेल स्तर जांचें + बाहरी लीनियर बेयरिंग साफ</td><td></td><td></td><td></td></tr>'
    +'<tr><td>16-17</td><td>इलेक्ट्रिकल/AC</td><td>अंदर धूल साफ, बाहरी पैनल साफ</td><td></td><td></td><td></td></tr>'
    +'<tr><td>18-20</td><td>प्लाज़्मा ट्रीटर</td><td>ओवरहीटिंग, प्लेट घिसाव, गैस रेगुलेटर लाइफ</td><td></td><td></td><td></td></tr>'
    +'<tr><td>21-23</td><td>ग्रीसिंग</td><td>Mobil SHC32 — रोटरी लीडथ्रू, पिवट बेयरिंग, विंच शाफ्ट</td><td></td><td></td><td></td></tr>'
    +'<tr><td>24-26</td><td>चकिंग/गियरबॉक्स</td><td>बाहरी बेयरिंग ग्रीस, लीनियर बेयरिंग, तेल/ग्रीस बदलें</td><td></td><td></td><td></td></tr>'
    +'<tr><td>27-32</td><td>वाइंडिंग + शटर</td><td>किकर्ट, लेआर्म, कैस्टर, व्यूइंग फ्लैप, शटर — सब ग्रीस</td><td></td><td></td><td></td></tr>'
    +'<tr><td>33-40</td><td>ग्रीसिंग (8 पॉइंट)</td><td>लेआर्म, स्प्रेडर, लोड सेल, ड्रम, DTR2, DTR1, ड्रॉ रोलर — दोनों सिरे</td><td></td><td></td><td></td></tr>'
    +'<tr><td>41-42</td><td>रील शाफ्ट/Deublin</td><td>बेयरिंग ग्रीस + अतिरिक्त ग्रीस हटाएं</td><td></td><td></td><td></td></tr>'
    +'</table>'}
},
'F10':{
  en:{t:'Quarterly PM Checklist — Metalliser-1 (3300mm)',no:'MET/F/10',
    h:'<b>Quarterly Inspection (11 Points)</b><table><tr><th>S.No.</th><th>Assembly</th><th>Task</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>'
    +'<tr><td>1</td><td>Cryo Maxcool Mk2</td><td>Check refrigeration system balance pressure via HMI</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>2</td><td>Vacuum System</td><td>Helium leak detector — chamber, pumps, pipework</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>3</td><td>GRE Chiller</td><td>Check suction & discharge pressure on interface</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>4</td><td>GRE Chiller</td><td>Measure feed vs return water temp (\\u0394T = blockage)</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>5</td><td>GRE Chiller</td><td>Pump & flow switch operation, record HMI values</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>6</td><td>GRE Chiller</td><td>Coolant (glycol) concentration — sample from hot tank</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>7</td><td>GRE Chiller</td><td>Glycol quality/contamination — change/flush if needed</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>8</td><td>MKS Baratron Gauge</td><td>Visual inspection pipework (plasma to faceplate)</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>9</td><td>Shield & Shutter</td><td>Open cylinder housing — clean guide rail, roller, cylinder</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>10</td><td>Wire Feeder</td><td>Plastic infeed bush condition check</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>11</td><td>Wire Feeder</td><td>Bearing rotation check</td><td></td><td></td><td></td><td></td></tr>'
    +'</table>'},
  hi:{t:'त्रैमासिक PM चेकलिस्ट — Metalliser-1 (3300mm)',no:'MET/F/10',
    h:'<b>त्रैमासिक निरीक्षण (11 बिंदु)</b><table><tr><th>क्र.</th><th>असेम्बली</th><th>कार्य</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>'
    +'<tr><td>1</td><td>क्रायो Maxcool Mk2</td><td>HMI द्वारा रेफ्रिजरेशन बैलेंस प्रेशर जांचें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>2</td><td>वैक्यूम सिस्टम</td><td>हीलियम लीक डिटेक्टर — चैम्बर, पंप, पाइपवर्क</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>3-5</td><td>GRE चिलर</td><td>सक्शन/डिस्चार्ज प्रेशर, वाटर टेम्प \\u0394T, पंप/फ्लो स्विच</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>6-7</td><td>GRE चिलर</td><td>ग्लाइकोल सांद्रता + गुणवत्ता/प्रदूषण जांच</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>8</td><td>MKS बैराट्रॉन</td><td>पाइपवर्क दृश्य निरीक्षण</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>9</td><td>शील्ड/शटर</td><td>सिलेंडर हाउसिंग खोलें, गाइड रेल साफ करें</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>10-11</td><td>वायर फीडर</td><td>इनफीड बुश स्थिति + बेयरिंग रोटेशन</td><td></td><td></td><td></td><td></td></tr>'
    +'</table>'}
},
'F11':{
  en:{t:'Quarterly PM Checklist — Metalliser-2 (3650mm)',no:'MET/F/11',
    h:'<b>Quarterly Inspection (11 Points) — Same checkpoints as Metalliser-1</b><table><tr><th>S.No.</th><th>Assembly</th><th>Task</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>'
    +'<tr><td>1</td><td>Cryo Maxcool Mk2</td><td>Balance pressure via HMI</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>2</td><td>Vacuum System</td><td>Helium leak detector</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>3-7</td><td>GRE Chiller (5 items)</td><td>Pressures, \\u0394T, flow switch, glycol concentration, glycol quality</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>8</td><td>MKS Baratron</td><td>Pipework visual inspection</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>9</td><td>Shield & Shutter</td><td>Open cylinder housing, clean guide rail</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>10-11</td><td>Wire Feeder</td><td>Infeed bush + bearing rotation</td><td></td><td></td><td></td><td></td></tr>'
    +'</table>'},
  hi:{t:'त्रैमासिक PM चेकलिस्ट — Metalliser-2 (3650mm)',no:'MET/F/11',
    h:'<b>त्रैमासिक निरीक्षण (11 बिंदु) — Metalliser-1 जैसे ही checkpoints</b><table><tr><th>क्र.</th><th>असेम्बली</th><th>कार्य</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>'
    +'<tr><td>1</td><td>क्रायो Maxcool</td><td>HMI बैलेंस प्रेशर</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>2</td><td>वैक्यूम</td><td>हीलियम लीक डिटेक्टर</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>3-7</td><td>GRE चिलर</td><td>प्रेशर, \\u0394T, फ्लो स्विच, ग्लाइकोल सांद्रता + गुणवत्ता</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>8</td><td>MKS बैराट्रॉन</td><td>पाइपवर्क निरीक्षण</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>9</td><td>शील्ड/शटर</td><td>सिलेंडर हाउसिंग, गाइड रेल साफ</td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td>10-11</td><td>वायर फीडर</td><td>इनफीड बुश + बेयरिंग</td><td></td><td></td><td></td><td></td></tr>'
    +'</table>'}
},
'F04':{
  en:{t:'Met Slitters Planning — Secondary',no:'MET/F/04',
    h:'<table><tr><th>Date</th><th>Shift</th><th>Slit Roll No.</th><th>Material</th><th>Input Width</th><th>Input Length</th><th>Customer Order</th><th>Output Width(s)</th><th>Output Length</th><th>Core ID</th><th>Met Side</th><th>Priority</th><th>Grade</th><th>Remarks</th></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>'},
  hi:{t:'मेट स्लिटर प्लानिंग — सेकेंडरी',no:'MET/F/04',
    h:'<table><tr><th>दिनांक</th><th>शिफ्ट</th><th>स्लिट रोल नं.</th><th>सामग्री</th><th>इनपुट चौड़ाई</th><th>इनपुट लंबाई</th><th>कस्टमर ऑर्डर</th><th>आउटपुट चौड़ाई</th><th>आउटपुट लंबाई</th><th>कोर ID</th><th>मेट साइड</th><th>प्राथमिकता</th><th>ग्रेड</th><th>टिप्पणी</th></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>'}
},
'F05':{
  en:{t:'Met Feed Planning — Primary Slitter',no:'MET/F/05',
    h:'<table><tr><th>Date</th><th>Shift</th><th>Met Jumbo No.</th><th>Material</th><th>Width (mm)</th><th>Length (m)</th><th>Customer/Order</th><th>Required Width(s)</th><th>Required Length</th><th>Core ID</th><th>OD Req.</th><th>Priority</th><th>Remarks</th></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>'},
  hi:{t:'मेट फीड प्लानिंग — प्राइमरी स्लिटर',no:'MET/F/05',
    h:'<table><tr><th>दिनांक</th><th>शिफ्ट</th><th>मेट जंबो नं.</th><th>सामग्री</th><th>चौड़ाई</th><th>लंबाई</th><th>कस्टमर/ऑर्डर</th><th>आवश्यक चौड़ाई</th><th>आवश्यक लंबाई</th><th>कोर ID</th><th>OD</th><th>प्राथमिकता</th><th>टिप्पणी</th></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
    +'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table>'}
},
'ML01':{
  en:{t:'Master List — Metalliser Formats',no:'ML/01',
    h:'<table><tr><th>S.No.</th><th>Format No.</th><th>Document Name</th><th>Frequency</th><th>Location</th></tr>'
    +'<tr><td>1</td><td>MET/F/01</td><td>Metallizer Log Book</td><td>Every Shift</td><td>Metalliser Dept</td></tr>'
    +'<tr><td>2</td><td>MET/F/02</td><td>Met Slitter Log Book</td><td>Every Shift</td><td>Slitting Dept</td></tr>'
    +'<tr><td>3</td><td>MET/F/04</td><td>Met Slitters Planning (Secondary)</td><td>Daily</td><td>Production Planning</td></tr>'
    +'<tr><td>4</td><td>MET/F/05</td><td>Met Feed Planning (Primary)</td><td>Daily</td><td>Production Planning</td></tr>'
    +'<tr><td>5</td><td>MET/F/06</td><td>Boats Life Testing Format</td><td>Per Trial</td><td>Metalliser Dept</td></tr>'
    +'<tr><td>6</td><td>MET/F/07</td><td>PM Checklist — Daily (21 points)</td><td>Daily</td><td>Maintenance</td></tr>'
    +'<tr><td>7</td><td>MET/F/08</td><td>PM Checklist — Weekly (35 points)</td><td>Weekly</td><td>Maintenance</td></tr>'
    +'<tr><td>8</td><td>MET/F/09</td><td>PM Checklist — Monthly (42 points)</td><td>Monthly</td><td>Maintenance</td></tr>'
    +'<tr><td>9</td><td>MET/F/10</td><td>PM Checklist — Quarterly/Annual Metalliser-1</td><td>Quarterly</td><td>Maintenance</td></tr>'
    +'<tr><td>10</td><td>MET/F/11</td><td>PM Checklist — Quarterly/Annual Metalliser-2</td><td>Quarterly</td><td>Maintenance</td></tr>'
    +'<tr><td>11</td><td>MET/F/12</td><td>Weekly+Monthly+Quarterly (IMS Format)</td><td>As scheduled</td><td>Maintenance</td></tr>'
    +'<tr><td>12</td><td>F/PRD/07</td><td>Metallised Roll Job Card</td><td>Every Roll</td><td>Production</td></tr>'
    +'<tr><td>13</td><td>GMP/F/10</td><td>Personal Hygiene Checklist</td><td>Monthly</td><td>Quality/GMP</td></tr>'
    +'<tr><td>14</td><td>PS/F/05</td><td>Blade Record (Slitter)</td><td>Per Blade</td><td>Slitting</td></tr>'
    +'</table>'},
  hi:{t:'मास्टर लिस्ट — मेटलाइज़र फॉर्मेट',no:'ML/01',
    h:'<table><tr><th>क्र.</th><th>फॉर्मेट नं.</th><th>दस्तावेज़ नाम</th><th>आवृत्ति</th><th>स्थान</th></tr>'
    +'<tr><td>1</td><td>MET/F/01</td><td>मेटलाइज़र लॉग बुक</td><td>हर शिफ्ट</td><td>मेटलाइज़र विभाग</td></tr>'
    +'<tr><td>2</td><td>MET/F/02</td><td>स्लिटर लॉग बुक</td><td>हर शिफ्ट</td><td>स्लिटिंग विभाग</td></tr>'
    +'<tr><td>3</td><td>MET/F/04</td><td>स्लिटर प्लानिंग (सेकेंडरी)</td><td>दैनिक</td><td>प्रोडक्शन प्लानिंग</td></tr>'
    +'<tr><td>4</td><td>MET/F/05</td><td>फीड प्लानिंग (प्राइमरी)</td><td>दैनिक</td><td>प्रोडक्शन प्लानिंग</td></tr>'
    +'<tr><td>5</td><td>MET/F/06</td><td>बोट लाइफ टेस्टिंग</td><td>प्रति ट्रायल</td><td>मेटलाइज़र विभाग</td></tr>'
    +'<tr><td>6-8</td><td>MET/F/07-09</td><td>PM चेकलिस्ट — दैनिक/साप्ताहिक/मासिक</td><td>शेड्यूल अनुसार</td><td>मेंटेनेंस</td></tr>'
    +'<tr><td>9-11</td><td>MET/F/10-12</td><td>PM चेकलिस्ट — त्रैमासिक/वार्षिक + IMS</td><td>शेड्यूल अनुसार</td><td>मेंटेनेंस</td></tr>'
    +'<tr><td>12</td><td>F/PRD/07</td><td>मेटलाइज़्ड रोल जॉब कार्ड</td><td>हर रोल</td><td>प्रोडक्शन</td></tr>'
    +'<tr><td>13</td><td>GMP/F/10</td><td>पर्सनल हाइजीन चेकलिस्ट</td><td>मासिक</td><td>क्वालिटी/GMP</td></tr>'
    +'<tr><td>14</td><td>PS/F/05</td><td>ब्लेड रिकॉर्ड (स्लिटर)</td><td>प्रति ब्लेड</td><td>स्लिटिंग</td></tr>'
    +'</table>'}
}


};

function downloadFormat(fid,lang){
  var fmt=FMT_DOCS[fid];
  if(!fmt)return;
  var d=fmt[lang]||fmt['en'];
  var doc='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>'
    +'body{font-family:Calibri,sans-serif;font-size:11pt;margin:0.8in}'
    +'table{border-collapse:collapse;width:100%;margin:8pt 0}'
    +'th,td{border:1px solid #000;padding:4pt 6pt;font-size:10pt}'
    +'th{background:#1B3A5C;color:#fff;text-align:center;font-weight:bold}'
    +'td{min-height:20pt}'
    +'</style></head><body>'
    +'<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72pt;color:rgba(200,200,200,0.06);font-weight:900;letter-spacing:8pt;z-index:-1">VKS TECH</div>'
    +'<div style="text-align:center;margin-bottom:14pt">'
    +'<div style="font-size:16pt;font-weight:bold;color:#1B3A5C">'+d.t+'</div>'
    +'<div style="font-size:10pt;color:#888">Format No.: '+d.no+' | '+(lang==='hi'?'हिंदी':'English')+'</div>'
    +'<div style="font-size:8pt;color:#aaa">\u00a9 VKS TECH \u2014 Vacuum Metallisation Knowledge Platform</div>'
    +'</div><hr style="border:1px solid #F0A500">'
    +d.h
    +'<br><table style="border:none"><tr style="border:none"><td style="border:none;width:50%"><b>'+(lang==='hi'?'जांचकर्ता:':'Checked By:')+'</b> _______________</td><td style="border:none;text-align:right"><b>'+(lang==='hi'?'हस्ताक्षर:':'Signature:')+'</b> _______________</td></tr></table>'
    +'<hr style="border:1px solid #ccc"><div style="font-size:8pt;color:#aaa">\u00a9 VKS TECH | '+new Date().toLocaleDateString()+'</div>'
    +'</body></html>';
  var blob=new Blob(['\ufeff'+doc],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=d.no.replace(/\//g,'_')+'_'+(lang==='hi'?'Hindi':'English')+'.doc';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _fmtBar(fid){
  return '<div class="ai-dl-bar" style="flex-wrap:wrap">'
    +'<button class="ai-dl-btn" onclick="downloadFormat(\''+fid+'\',\'en\')" style="color:#2196F3">📄 English Doc</button>'
    +'<button class="ai-dl-btn" onclick="downloadFormat(\''+fid+'\',\'hi\')" style="color:#FF9800">📄 हिंदी Doc</button>'
    +'</div>';
}




function _detectFmt(answer,query){
  var ql=query.toLowerCase();
  var map=[
    [/met.?f.?01|metallizer.*log|logbook.*cycle/i,'F01'],
    [/met.?f.?02|slitter.*log|logbook.*input.*output/i,'F02'],
    [/met.?f.?04|slitter.*planning.*secondary/i,'F04'],
    [/met.?f.?05|feed.*planning.*primary/i,'F05'],
    [/met.?f.?06|boat.*life.*test|boats.*testing/i,'F06'],
    [/met.?f.?07|daily.*pm|daily.*checklist|21.*point|दैनिक.*pm/i,'F07'],
    [/met.?f.?08|weekly.*pm.*35|weekly.*checklist|35.*point|साप्ताहिक.*pm/i,'F08'],
    [/met.?f.?09|monthly.*pm.*42|monthly.*checklist|42.*point|मासिक.*pm/i,'F09'],
    [/met.?f.?10|quarterly.*met.?1|quarterly.*metalliser.?1/i,'F10'],
    [/met.?f.?11|quarterly.*met.?2|quarterly.*metalliser.?2/i,'F11'],
    [/f.?prd.?07|job.*card|metallised.*roll.*card/i,'FPRD07'],
    [/gmp.?f.?10|hygiene.*checklist|personal.*hygiene|हाइजीन/i,'GMP10'],
    [/oil.*coolant.*schedule|oil.*replacement|anderol|castrol.*hyspin|तेल.*शेड्यूल/i,'OIL'],
    [/ml.?01|master.*list.*format|मास्टर.*लिस्ट/i,'ML01'],
    [/wi.?07|shield.*shutter.*clean|शील्ड.*शटर/i,'WI07'],
    [/wi.?08|film.*threading|फिल्म.*थ्रेडिंग/i,'WI08'],
    [/wi.?11|metallization.*process|मेटलाइज़ेशन.*प्रोसेस/i,'WI11'],
    [/wi.?12|open.*chamber|चैम्बर.*खोल/i,'WI12'],
    [/wi.?13|quality.*inspection.*during|क्वालिटी.*इंस्पेक्शन/i,'WI13'],
    [/wi.?17|film.*waste.*disposal|फिल्म.*वेस्ट/i,'WI17'],
    [/wi.?18|source.*area.*clean|सोर्स.*एरिया.*क्लीन/i,'WI18']
  ];
  for(var i=0;i<map.length;i++){
    if(map[i][0].test(ql)||map[i][0].test(answer)){
      return _fmtBar(map[i][1]);
    }
  }
  return '';
}

function enterDefect(){
  MODE='gen';clearR();nav('defect');updateTopbar();
}

function rDefect(pg){
  var defects=[
    {ico:'📉',t:'Low OD',h:'OD कम',q:'low od action plan',c:'#e53935'},
    {ico:'📈',t:'High OD',h:'OD ज़्यादा',q:'high od action plan',c:'#F57C00'},
    {ico:'↔️',t:'Uneven OD',h:'एक तरफ कम/ज़्यादा',q:'uneven od action plan',c:'#AB47BC'},
    {ico:'📊',t:'OD Fluctuating',h:'OD ऊपर नीचे',q:'od fluctuating action plan',c:'#5C6BC0'},
    {ico:'🔵',t:'Pinholes',h:'पिनहोल / छेद',q:'pinhole action plan',c:'#0288D1'},
    {ico:'〰️',t:'Wrinkles',h:'झुर्री / क्रीज़',q:'wrinkle crease action plan',c:'#00897B'},
    {ico:'➖',t:'Scratches',h:'खरोंच / लाइन',q:'scratch line action plan',c:'#6D4C41'},
    {ico:'⚪',t:'White Spots',h:'सफ़ेद दाग',q:'white spot haze action plan',c:'#78909C'},
    {ico:'🔓',t:'Poor Adhesion',h:'कोटिंग नहीं चिपक रही',q:'poor adhesion action plan',c:'#D84315'},
    {ico:'💥',t:'Web Break',h:'फिल्म टूट गई',q:'web break action plan',c:'#C62828'},
    {ico:'📐',t:'Telescoping',h:'रोल सिधा नहीं',q:'telescoping action plan',c:'#4527A0'},
    {ico:'🔒',t:'Blocking',h:'लेयर चिपक रही',q:'blocking action plan layers',c:'#2E7D32'},
    {ico:'⭐',t:'Starring',h:'कोर पर स्टार',q:'starring action plan core',c:'#FF8F00'},
    {ico:'💔',t:'Boat Cracking',h:'बोट टूट गया',q:'boat cracking action plan',c:'#AD1457'},
    {ico:'🐢',t:'Slow Pumpdown',h:'पंपडाउन धीमा',q:'slow pumpdown action plan',c:'#00695C'},
    {ico:'🧹',t:'Metal Flaking',h:'कोटिंग उखड़ रही',q:'metal flaking action plan',c:'#37474F'}
  ];
  var grid=defects.map(function(d){
    return '<button onclick="nav(\'askai\');setTimeout(function(){askAI(\''+d.q+'\')},300)" style="background:linear-gradient(135deg,'+d.c+'22,'+d.c+'08);border:2px solid '+d.c+'66;border-radius:14px;padding:14px 12px;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .2s;font-family:inherit" ontouchstart="" onmousedown="this.style.transform=\'scale(.95)\'" onmouseup="this.style.transform=\'\'" onmouseleave="this.style.transform=\'\'">'
    +'<div style="font-size:28px">'+d.ico+'</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:15px;font-weight:900;color:'+d.c+';text-transform:uppercase;letter-spacing:.02em;line-height:1.2">'+d.t+'</div>'
    +'<div style="font-size:11px;color:rgba(255,255,255,.55);font-family:\'Mukta\',\'Hind\',sans-serif;line-height:1.3">'+d.h+'</div>'
    +'</button>';
  }).join('');

  pg.innerHTML=
    '<div class="ph"><div class="ph-code">DEFECT ACTION PLANS</div>'
    +'<div class="ph-title">डिफेक्ट <span>Action Plans</span></div>'
    +'<div class="ph-desc">मशीन पर कोई भी defect दिखे — नीचे tap करो → Step-by-Step समाधान मिलेगा। हर plan: Confirm → #1 कारण check → Fix → Verify</div>'
    +'<div class="tags"><span class="tag" style="background:rgba(229,57,53,.2);color:#e53935;border-color:rgba(229,57,53,.4)">16 Defects</span><span class="tag a">Hindi + English</span><span class="tag c">Real-Time Steps</span></div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:0 12px 20px">'+grid+'</div>'
    +'<div style="padding:0 16px 12px">'
    +CB('📋','Master Defect Guide — सभी Defects एक नज़र में','Quick Reference',
      '<div style="font-size:13px;color:#aaa;line-height:1.6">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:rgba(229,57,53,.15)"><th style="padding:6px;text-align:left;color:#e53935">#</th><th style="padding:6px;text-align:left;color:#e53935">Defect</th><th style="padding:6px;text-align:left;color:#e53935">#1 कारण</th><th style="padding:6px;text-align:left;color:#e53935">Quick Fix</th></tr></thead><tbody>'
      +'<tr style="border-bottom:1px solid #222"><td>1</td><td>Low OD</td><td>Wire feed</td><td>Groove/spout</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>2</td><td>High OD</td><td>Speed कम</td><td>Speed/recipe</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>3</td><td>Uneven</td><td>Boat fail</td><td>Specific boat</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>4</td><td>Fluctuating</td><td>Wire feed</td><td>Springs/spout</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>5</td><td>Pinholes</td><td>Dirty rollers</td><td>IPA clean</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>6</td><td>Wrinkles</td><td>Spreader</td><td>Kickert adjust</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>7</td><td>Scratches</td><td>Particle</td><td>Roller clean</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>8</td><td>White Spots</td><td>Moisture</td><td>Cryo/pumpdown</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>9</td><td>Adhesion</td><td>Low dyne</td><td>Plasma treater</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>10</td><td>Web Break</td><td>Tension ↑</td><td>Reduce tension</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>11</td><td>Telescoping</td><td>No taper</td><td>30-50% taper</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>12</td><td>Blocking</td><td>Tension ↑</td><td>Reduce + taper</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>13</td><td>Starring</td><td>No taper</td><td>30-50% taper</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>14</td><td>Boat Crack</td><td>Dirty contacts</td><td>Clean+graphite</td></tr>'
      +'<tr style="border-bottom:1px solid #222"><td>15</td><td>Slow Pump</td><td>O-ring</td><td>Door seal</td></tr>'
      +'<tr><td>16</td><td>Flaking</td><td>Low dyne</td><td>Treatment check</td></tr>'
      +'</tbody></table></div>',true)
    +'</div>';
}

// ══════════════════════════════════════════════════════
// MET OPERATION — HINDI
// ══════════════════════════════════════════════════════
function rMet(pg){
  var g=MODE==='free';
  var params=Tabs(
    ['ABM22 (AlBond)','ABM25 (Met Only)','CPP (20/30 Mic)','AlOx Special'],
    [
      '<table class="t"><thead><tr><th>पैरामीटर</th><th>मान</th><th>इकाई</th></tr></thead><tbody>'
      +'<tr><td>AlBond Intensity O₂</td><td class="tv">5.0–5.5</td><td>~400 SCCM</td></tr>'
      +'<tr><td>मशीन गति (Speed)</td><td class="tv">650</td><td>m/min</td></tr>'
      +'<tr><td>Plasma Power</td><td class="tv">5</td><td>kW</td></tr>'
      +'<tr><td>Plasma Gas Flow</td><td class="tv">1000</td><td>SCCM</td></tr>'
      +'<tr><td>O₂ सप्लाई</td><td class="tv">80</td><td>%</td></tr>'
      +'<tr><td>OD लक्ष्य</td><td class="tv">2.2–2.5</td><td>—</td></tr>'
      +'<tr><td>Surface Energy (न्यूनतम)</td><td class="tv g">&gt;54</td><td>Dynes</td></tr>'
      +'</tbody></table>'+Al('w','⚠️','Material: 3SF-G10301ABM22 / 3SF-G12301ABM22 | उपरोक्त मान TDS के अनुसार अधिकतम हैं।'),

      '<table class="t"><thead><tr><th>पैरामीटर</th><th>मान</th><th>इकाई</th></tr></thead><tbody>'
      +'<tr><td>AlBond Intensity O₂</td><td class="tv">4.0–4.5</td><td>~320 SCCM</td></tr>'
      +'<tr><td>मशीन गति (Speed)</td><td class="tv">750</td><td>m/min</td></tr>'
      +'<tr><td>Plasma Power</td><td class="tv">5</td><td>kW</td></tr>'
      +'<tr><td>O₂ सप्लाई</td><td class="tv">80</td><td>%</td></tr>'
      +'<tr><td>OD लक्ष्य</td><td class="tv">2.2–2.5</td><td>—</td></tr>'
      +'</tbody></table>'+Al('i','ℹ️','ABM25: AlBond नहीं लगता — केवल Met। इसीलिए गति 750 m/min तक संभव है।'),

      '<table class="t"><thead><tr><th>पैरामीटर</th><th>मान</th><th>इकाई</th></tr></thead><tbody>'
      +'<tr><td>Coating Drum तापमान</td><td class="tv">−20</td><td>°C</td></tr>'
      +'<tr><td>मशीन गति</td><td class="tv">660</td><td>m/min</td></tr>'
      +'<tr><td>Rewinder Tension (2090MM)</td><td class="tv">120–150</td><td>Newton</td></tr>'
      +'<tr><td>वाइंडिंग दिशा</td><td class="tv">बाहर (Out)</td><td>—</td></tr>'
      +'<tr><td>OD लक्ष्य</td><td class="tv">2.2</td><td>—</td></tr>'
      +'<tr><td>औसत चौड़ाई</td><td class="tv">2090</td><td>mm</td></tr>'
      +'</tbody></table>'+Al('w','⚠️','CPP 30/20 MIC — COF 0.2। कुल वेस्ट लक्ष्य अधिकतम 5.1% (4.1% शीट + 1% ट्रिम)।'),

      '<table class="t"><thead><tr><th>पैरामीटर</th><th>लक्ष्य</th><th>नोट</th></tr></thead><tbody>'
      +'<tr><td>Metal OD</td><td class="tv">0.45</td><td>UCL 0.47 / LCL 0.42</td></tr>'
      +'<tr><td>AlOx Target OD</td><td class="tv">0.11</td><td>—</td></tr>'
      +'<tr><td>Transmittance</td><td class="tv">88%</td><td>±1%</td></tr>'
      +'<tr><td>Topcoat से पहले Curing</td><td class="tv">40 दिन</td><td>निर्माण तिथि से</td></tr>'
      +'</tbody></table>'+Al('d','⛔','AlOx कोटिंग 40nm से भी पतली है — अत्यंत नाज़ुक! फर्श पर कभी न रखें। हमेशा foam cushion पर रखें। तेज़ मोड़ बिल्कुल न दें।'),
    ]
  );

  var glsM=g?CB('🏭','मशीन डेटा — Metalliser-1 और Metalliser-2','केवल आंतरिक',
    '<div class="compare">'
    +'<div class="cbox"><div class="cbox-t">Metalliser-1 — BOBST K5 (3300mm)</div>'
    +'<div class="cr"><span class="ck">SAP कोड</span><span class="cv">3-M1_W | GP03</span></div>'
    +'<div class="cr"><span class="ck">12µ ABM22 गति</span><span class="cv">625 m/min</span></div>'
    +'<div class="cr"><span class="ck">G301 M22 गति</span><span class="cv">750 m/min</span></div>'
    +'<div class="cr"><span class="ck">रोल/दिन लक्ष्य</span><span class="cv">8 रोल</span></div>'
    +'<div class="cr"><span class="ck">सेटअप लक्ष्य</span><span class="cv">10–15 मिनट</span></div>'
    +'<div class="cr"><span class="ck">Unwinder Stop 6" Steel</span><span class="cv">181 mm</span></div>'
    +'<div class="cr"><span class="ck">Unwinder Stop 6" Paper 12mm</span><span class="cv">184 mm</span></div>'
    +'</div>'
    +'<div class="cbox"><div class="cbox-t">Metalliser-2 — BOBST K5 (3650mm)</div>'
    +'<div class="cr"><span class="ck">SAP कोड</span><span class="cv">3-M2_W | GP05</span></div>'
    +'<div class="cr"><span class="ck">12µ ABM25 गति</span><span class="cv">600 m/min</span></div>'
    +'<div class="cr"><span class="ck">CPP गति</span><span class="cv">660 m/min</span></div>'
    +'<div class="cr"><span class="ck">रोल/दिन लक्ष्य</span><span class="cv">7 रोल (12µ)</span></div>'
    +'<div class="cr"><span class="ck">Vacuum+Heat समय</span><span class="cv">20 मिनट</span></div>'
    +'<div class="cr"><span class="ck">Unwinder Stop 8" Steel</span><span class="cv">222 mm</span></div>'
    +'<div class="cr"><span class="ck">Unwinder Stop 8" Paper 17mm</span><span class="cv">241 mm</span></div>'
    +'</div></div>'
    +Al('i','📊','दिसंबर 2025 Boat परीक्षण: TOMOE Engineering Di-Met 125×38×9.5MM, Group 7 (3200-3600 µΩ·cm) — प्रदर्शन मौजूदा supplier के समकक्ष।'),
  true):'';

  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मॉड्यूल 1 — मेटलाइज़र ऑपरेशन</div>'
    +'<div class="ph-title">मेटलाइज़र <span>प्रशिक्षण</span></div>'
    +'<div class="ph-desc">वैक्युम मेटलाइज़ेशन: प्रक्रिया अवलोकन, चेंबर संचालन, पैरामीटर, बोट चेंज, रोल हैंडलिंग और वेस्ट नियंत्रण।</div>'
    +'<div class="tags"><span class="tag a">SOP 01–07</span><span class="tag c">WI 04,10,16,24</span></div></div>'

    +CB('📖','मेटलाइज़ेशन प्रक्रिया — 10 चरण','MET SOP 01',
      '<div class="flow">'
      +F(1,'फिल्म चयन एवं योजना','प्लानिंग फॉर्मेट MET F-04 देखें। बेयर रोल की Surface Energy >54 Dynes जांचें। रोल चौड़ाई के अनुसार Shield Plate चुनें।<span class="en">Film Selection & Planning — Check MET F-04 planning. Surface energy >54 Dynes. Select shield per width.</span>')
      +F(2,'रोल को मेटलाइज़र तक लाना','Conveyor conveyor start से conveyor end। Crane से 5MT से अधिक क्षमता का Sling Belt उपयोग करें। Safety Helmet अनिवार्य। रोल के दोनों सिरों पर Foam Sheet लगाएं।<span class="en">Roll Transport — Conveyor conveyor start/23. Crane sling belt >5MT. Safety Helmet mandatory.</span>')
      +F(3,'Unwinder पर रोल लोडिंग — WI-10','Tension OFF करें। फिल्म थ्रेड करें। दोनों तरफ Chuck Lock करें। Film की दिशा (Inside/Outside) कस्टमर के अनुसार सेट करें।<span class="en">Roll Loading WI-10 — Tension off, thread film, lock chucks both sides, verify I/O direction.</span>')
      +F(4,'बोट चेंज और मशीन सेटअप — WI-04','Evaporator, Drum और Shield को साफ करें। हर बोट के दोनों सिरों पर Graphite Foil लगाएं। Plasma Unit साफ करें। लक्ष्य: 10–15 मिनट।<span class="en">Boat Change WI-04 — Clean evaporator, drum, shield. Graphite foil both boat ends. Target 10-15 min.</span>')
      +F(5,'Vacuum Pump Down और हीटिंग','Chamber बंद करें। Pump Sequence से ~10⁻⁴ mbar तक Vacuum बनाएं। Run Temperature तक गर्म करें। समय: ~20 मिनट।<span class="en">Vacuum pump down to ~10⁻⁴ mbar. Heat to run temperature. ~20 minutes.</span>')
      +F(6,'मेटलाइज़ेशन रन','625–820 m/min गति। Al wire → Boats 700–1000°C → Al vapour → Film पर 20–50nm परत। Hawk-Eye OD निरंतर जांचता है।<span class="en">Run at 625-820 m/min. Al wire to boats 700-1000°C. Al vapour deposits 20-50nm. Hawk-Eye monitors OD.</span>')
      +F(7,'रोल समाप्ति — Shutter और Vent','रोल खत्म होने पर Shutter बंद करें। क्रमबद्ध तरीके से बंद करें। AUTO मोड में Vent करें। सुरक्षित तापमान होने तक प्रतीक्षा करें।<span class="en">Close shutter at roll end. Stop in sequence. Vent AUTO. Wait for safe temperature.</span>')
      +F(8,'रोल अनलोडिंग — WI-10','फिल्म काटें। Chuck Unlock करें। Crane Hanger को Shaft के दोनों तरफ लगाएं। धीरे-धीरे Felt पर उतारें। Felt पर धातु या तेल न लगने दें।<span class="en">Cut film, unlock chucks, crane hanger both sides, remove SLOWLY onto felt. No oil on felt.</span>')
      +F(9,'Logbook प्रविष्टि — MET F-01','रिकॉर्ड करें: Cycle समय, OD, गति, Supervisor नाम, Wire मात्रा, Boat मात्रा, Downtime कारण।<span class="en">Record cycle times, OD, speed, supervisor names, wire qty, boat qty, downtime reason.</span>')
      +F(10,'SAP प्रविष्टि और ग्रेडिंग','COR1 + ZPP_METJUMBO (plant SAP T-code) T-Code। ग्रेड: 2/3/5/6/7/8। दोष दर्ज करें। स्लिटर को पास करें।<span class="en">COR1 + ZPP_METJUMBO (plant SAP T-code). Grade 2/3/5/6/7/8. Record defects. Pass to slitter.</span>')
      +'</div>',true)

    +CB('⚙️','ऑपरेटिंग पैरामीटर','SOP 04 / 05 / 06',params)
    +glsM
    +CB('🚢','बोट चेंज प्रोग्राम','WI-04',
      '<ul class="steps">'
      +S('A','<strong>Evaporator साइड</strong> को अच्छी तरह साफ करें — सभी Al Oxide जमाव हटाएं।<span class="en">Clean evaporator side thoroughly — remove all Al oxide deposits.</span>',true)
      +S('B','Drum और Shield साफ करें — Al Oxide से पूरी तरह मुक्त करें।<span class="en">Clean Drum and Shield — free from all Al oxide residue.</span>',true)
      +S('C','Vacuum Cleaner से Source Area की सभी Al Dust हटाएं।<span class="en">Vacuum cleaner — remove ALL Al dust from source area.</span>',true)
      +S('D','हर बोट के <strong>दोनों सिरों पर Graphite Foil</strong> लगाएं — इंस्टॉल करने से पहले।<span class="en">Graphite foil at BOTH ends of each boat before installation.</span>',true)
      +S('E','बोट <strong>कसकर</strong> लगाएं — ढीला बोट = असमान वाष्पीकरण।<span class="en">Boats fitted TIGHTLY — loose boats cause uneven evaporation.</span>',true)
      +S('F','सभी Rollers और Plasma Unit साफ करें।<span class="en">Clean all rollers and plasma unit.</span>',true)
      +'</ul>')

    +CB('📏','वेस्ट नियंत्रण','WI-24',
      '<div class="stats">'
      +'<div class="stat"><div class="stat-v">0.14%</div><div class="stat-l">स्टार्ट-स्टॉप<br>100m/72km</div></div>'
      +'<div class="stat"><div class="stat-v">0.54%</div><div class="stat-l">ट्रिम वेस्ट<br>15mm/2900mm</div></div>'
      +'<div class="stat"><div class="stat-v">0.08%</div><div class="stat-l">सैम्पल वेस्ट<br>60m/72km</div></div>'
      +'<div class="stat"><div class="stat-v" style="color:var(--red)">0%</div><div class="stat-l">B-ग्रेड<br>लक्ष्य</div></div>'
      +'<div class="stat"><div class="stat-v">≤0.8%</div><div class="stat-l">कुल वेस्ट<br>लक्ष्य</div></div>'
      +'</div>'
      +Al('d','⛔','B-ग्रेड = शून्य सहनशीलता। कम OD, Pinhole, खरोंच, Crease, OD Band दिखे तो <strong>मशीन तुरंत बंद करें</strong>। "चलता है" रवैया बिल्कुल स्वीकार्य नहीं।')
      +Al('w','⚠️','ट्रिम अधिकतम 15mm दोनों तरफ। प्रति Jumbo 3 सैम्पल = 60m केवल (7 layers, 20m प्रति सेट)। अतिरिक्त कटाई सख्त मना है।'));
}

// ══════════════════════════════════════════════════════
// SLITTER — HINDI
// ══════════════════════════════════════════════════════
function rSlit(pg){
  var grades='<div class="grades">'
    +G(2,'OK / A-ग्रेड','सभी मानक पूरे। सामान्य डिस्पैच।',"'#18c97a'")
    +G(3,'B-ग्रेड','मानक से नीचे। कारण और टिप्पणी दर्ज करें।',"'#f0a500'")
    +G(5,'Salvageable','पुनः स्लिटिंग से ठीक हो सकता है।',"'#3a9fd8'")
    +G(6,'Offcut/Waste','ट्रिम और बेकार स्क्रैप।',"'#e84545'")
    +G(7,'→ कोटिंग','कोटिंग विभाग को भेजें।',"'#9d4edd'")
    +G(8,'OK-प्रतीक्षारत','गुणवत्ता ठीक, अभी ऑर्डर नहीं।',"'#506070'")
    +'</div>';

  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मॉड्यूल 2 — स्लिटर ऑपरेशन</div>'
    +'<div class="ph-title">स्लिटर <span>प्रशिक्षण</span></div>'
    +'<div class="ph-desc">मशीन सेटअप, ब्लेड प्रबंधन, कॉर्क टेप, क्रिटिकल कस्टमर, रोल ग्रेडिंग और जॉइंट की पूरी जानकारी।</div>'
    +'<div class="tags"><span class="tag a">SL WI 01–10</span><span class="tag c">SOP 09</span><span class="tag g">WI 19, 25</span></div></div>'

    +CB('📋','मशीन सेटअप — शुरू करने से पहले','SL WI-02',
      '<ul class="steps">'
      +S(1,'प्लानिंग फॉर्मेट <strong>MET F-04</strong> में स्लिटिंग चौड़ाई जांचें।<span class="en">Check planning format MET F-04 for slitting widths.</span>')
      +S(2,'प्लान के अनुसार सही मेटलाइज़्ड Jumbo Roll चुनें।<span class="en">Select correct metallised jumbo roll as per plan.</span>')
      +S(3,'ब्लेड की स्थिति जांचें — घिसा हो तो बदलें (Lutz या Paper Cutter ब्लेड)।<span class="en">Check blade condition — replace if worn (Lutz or Paper Cutter blade).</span>')
      +S(4,'Unwinder और Rewinder Tension मटेरियल के अनुसार सेट करें।<span class="en">Set Unwinder and Rewinder tension per material spec.</span>')
      +S(5,'Nip Roller जांचें — कट के निशान या असमानता नहीं होनी चाहिए।<span class="en">Check Nip roller — no cut marks or unevenness.</span>')
      +S(6,'फिल्म थ्रेड करें — मेटल साइड (I = Inside / O = Outside) सही से जांचें।<span class="en">Thread film — verify correct metal side (I = Inside / O = Outside).</span>')
      +S(7,'Core जांचें: ID (3/6/8"), प्रकार (RC/नई), मोटाई (13/15/16mm)।<span class="en">Verify Core: ID (3/6/8"), Type (RC/New), Thickness (13/15/16mm).</span>')
      +S(8,'फिल्म मोटाई (8/10/12/19µ) और रोल लंबाई (24,000/36,000m) जांचें।<span class="en">Verify film thickness (8/10/12/19µ) and roll length (24,000/36,000m).</span>')
      +'</ul>',true)

    +CB('🔪','ब्लेड बदलने की प्रक्रिया','SL WI-03',
      '<ul class="steps">'
      +S(1,'ब्लेड काम से पहले <strong>मशीन पूरी तरह बंद करें</strong>।<span class="en">STOP machine completely before any blade work.</span>')
      +S(2,'ब्लेड हाथ में लेने से पहले कट-रेज़िस्टेंट <strong>दस्ताने पहनें</strong>।<span class="en">Wear cut-resistant gloves before handling blades.</span>')
      +S(3,'पुराने ब्लेड की स्थिति और मीटर Blade Logbook (PS F-05) में दर्ज करें।<span class="en">Record old blade condition and metres run in logbook PS F-05.</span>')
      +S(4,'घिसा ब्लेड सावधानी से निकालें — केवल Non-Cutting Edge से पकड़ें।<span class="en">Remove worn blade carefully — handle by non-cutting edge only.</span>')
      +S(5,'नया ब्लेड सही कोण और Engagement Depth पर लगाएं।<span class="en">Install new blade at correct angle and engagement depth.</span>')
      +S(6,'Side Force और ट्रिम गुणवत्ता Slow Test Run से जांचें।<span class="en">Check side force and trim quality with slow test run.</span>')
      +S(7,'Logbook में दर्ज करें: ब्लेड Batch No., तारीख, स्थिति।<span class="en">Record blade batch number, date, position in logbook.</span>')
      +'</ul>'
      +Al('d','⛔','खुले हाथ से ब्लेड कभी न छुएं। Blade Log हमेशा अद्यतन रखें। घिसे ब्लेड से Edge Defect और Downgrade होता है।'))

    +CB('🌀','Rewinder पर कॉर्क टेप','WI-19',
      '<table class="t"><thead><tr><th>कोण</th><th>फायदा</th><th>सिफारिश</th></tr></thead><tbody>'
      +'<tr><td class="tv">30°</td><td>सबसे मजबूत पकड़</td><td>हाई स्पीड >800 m/min</td></tr>'
      +'<tr><td class="tv">35°–40°</td><td>हाई-स्पीड के लिए सर्वोत्तम</td><td>✅ अनुशंसित</td></tr>'
      +'<tr><td class="tv">45°</td><td>लगाना आसान</td><td>सामान्य उपयोग</td></tr>'
      +'<tr><td class="tv r">&gt;60°</td><td>किनारा उठना, कंपन</td><td>❌ न करें</td></tr>'
      +'</tbody></table>'
      +'<ul class="steps">'
      +S(1,'<strong>सतह तैयारी:</strong> Roller को IPA से साफ करें। सूखा, धूल-रहित, तेल-रहित।<span class="en">Clean roller with IPA — dry, dust-free, oil-free.</span>')
      +S(2,'<strong>पहला लपेट:</strong> पहले सिरे को 0° (सपाट) पर 2 चक्कर लगाएं। मजबूती से दबाएं — हवा के बुलबुले नहीं।<span class="en">Anchor first end flat 0° for 2 turns. Press firmly — no air bubbles.</span>')
      +S(3,'<strong>Spiral Wrap:</strong> 30°–45° कोण पर कसकर लपेटें। 2-3mm ओवरलैप, कोई गैप नहीं।<span class="en">Spiral wrap at 30°–45°. 2-3mm overlap, no gaps.</span>')
      +S(4,'<strong>समाप्ति:</strong> 0° पर 2 सपाट लपेट। High-Temp चिपकने से सुरक्षित करें। Heat Cure 80–100°C (वैकल्पिक)।<span class="en">End with 2 flat turns at 0°. Secure with epoxy. Heat cure 80-100°C optional.</span>')
      +'</ul>')

    +CB('⭐','क्रिटिकल कस्टमर आवश्यकताएं','WI-25',
      Al('d','⛔','क्रिटिकल: JAYESH | PEPSICO | AMCOR | UMAX | EXPORT — विशेष अनिवार्य नियम।')
      +'<ul class="steps">'
      +S(1,'मेटलाइज़ेशन के बाद प्लानिंग फाइल में क्रिटिकल कस्टमर की स्लिटिंग चौड़ाई जांचें।<span class="en">After metallisation check planning file for critical customer widths.</span>')
      +S(2,'<strong>JAYESH / PEPSICO:</strong> स्लिट चौड़ाई Jumbo के <strong>केंद्र में</strong> होनी चाहिए — किनारे पर कभी नहीं। इससे Low OD और Crease से बचाव होता है।<span class="en">JAYESH/PEPSICO: widths MUST be at CENTRE of jumbo — never at edges.</span>')
      +S(3,'<strong>AMCOR / UMAX / EXPORT:</strong> सभी कस्टमर रोल पर दिशा तीर चिपकाएं (Packing Mode HP)।<span class="en">AMCOR/UMAX/EXPORT: paste direction arrow on all rolls (Packing Mode HP).</span>')
      +S(4,'<strong>G901 मटेरियल</strong> को M/S के G360 में नहीं भेजा जा सकता।<span class="en">G901 material CANNOT be diverted to G360 for M/S.</span>')
      +S(5,'यदि दोष Job Card में नहीं है और रोल Downgrade हो — तो ऑपरेटर की लापरवाही मानी जाएगी।<span class="en">Defect not in Job Card and roll downgrades = Operator Negligence ruling.</span>')
      +'</ul>')

    +CB('📊','ग्रेड प्रणाली और रोल स्थिति','SAP ZPP_SLIT',
      grades
      +'<table class="t"><thead><tr><th>रोल संख्या</th><th>स्थिति कोड</th><th>नोट</th></tr></thead><tbody>'
      +'<tr><td>3 रोल</td><td class="tv">L / C / R</td><td>Operator → Center → Drive</td></tr>'
      +'<tr><td>4 रोल</td><td class="tv">L / A / B / R</td><td>Operator → Drive side</td></tr>'
      +'<tr><td>घरेलू ऑर्डर</td><td class="tv">अधिकतम 2 जॉइंट</td><td>—</td></tr>'
      +'<tr><td>Export ऑर्डर</td><td class="tv">अधिकतम 1 जॉइंट</td><td>AMCOR/UMAX: शून्य बेहतर</td></tr>'
      +'</tbody></table>'
      +Al('w','⚠️','ग्रेड 3/5/8 के लिए — उदाहरण टिप्पणी: "Downgrade Reason: Low OD | Remark: Low OD Edge 20mm, OD 1.6-1.9"'))

    +CB('📋','रिपल-फ्री स्लिटिंग पैरामीटर','SOP 09',
      '<table class="t"><thead><tr><th>पैरामीटर</th><th>मान</th><th>इकाई</th></tr></thead><tbody>'
      +'<tr><td>Rewinding Tension</td><td class="tv">90</td><td>N/M</td></tr>'
      +'<tr><td>Nip Pressure</td><td class="tv">700</td><td>N/m²</td></tr>'
      +'<tr><td>मशीन गति</td><td class="tv">500</td><td>m/min</td></tr>'
      +'<tr><td>Unwinder Tension</td><td class="tv">90</td><td>N/M</td></tr>'
      +'</tbody></table>'
      +Al('i','ℹ️','रिपल-फ्री के लिए कम गति और कड़ी Tension ज़रूरी है। कॉर्क टेप अच्छी स्थिति में हो। चलाने से पहले Nip की समानता जांचें।'));
}
