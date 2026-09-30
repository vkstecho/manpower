/**
 * Man Power — split module (P3). Loaded after app-core.js in global scope.
 * Do not use ES modules here — functions share window globals with app-core.
 */
// MODULE: schedule / leaves / reports / pending
// ════════════════════════════════════════
// SCHEDULE
// ════════════════════════════════════════
let schedOff=-5, schedSec='ALL';
let schedSubMulti = []; // multi-select secondary chips e.g. ['MC:M-1','MC:M-2']

let _customRangeActive=false, _customDateFrom='', _customDateTo='';

// ════════════════════════════════════════
// CUSTOM DATE RANGE
// ════════════════════════════════════════
function openCustomRange(){
  // Pre-fill: if custom range already active, show it; else show current window
  if(_customRangeActive && _customDateFrom && _customDateTo){
    document.getElementById('customDateFrom').value=_customDateFrom;
    document.getElementById('customDateTo').value=_customDateTo;
  } else {
    const cur0=addDays(TODAY_STR,schedOff);
    const cur1=addDays(TODAY_STR,schedOff+15);
    document.getElementById('customDateFrom').value=cur0;
    document.getElementById('customDateTo').value=cur1;
  }
  // Set min/max — allow multi-year (5 years back / 5 years forward)
  const minDate=addDays(TODAY_STR,-365*5);
  const maxDate=addDays(TODAY_STR,365*5);
  document.getElementById('customDateFrom').min=minDate;
  document.getElementById('customDateFrom').max=maxDate;
  document.getElementById('customDateTo').min=minDate;
  document.getElementById('customDateTo').max=maxDate;
  document.getElementById('customRangeOverlay').classList.add('open');
  // Reset preset highlights to reflect current dates
  document.querySelectorAll('.qr-btn').forEach(b=>{
    b.style.background='var(--card)'; b.style.color='var(--muted2)';
    b.style.borderColor='var(--border2)'; b.style.fontWeight='700';
  });
}
function closeCustomRange(){
  document.getElementById('customRangeOverlay').classList.remove('open');
}
function _quickRange(days){
  const from = addDays(TODAY_STR, -(days-1));
  document.getElementById('customDateFrom').value = from;
  document.getElementById('customDateTo').value = TODAY_STR;
  document.querySelectorAll('.qr-btn').forEach(b=>{
    const active = b.id === 'qr_'+days;
    b.style.background = active ? 'var(--m1)' : 'var(--card)';
    b.style.color = active ? '#fff' : 'var(--muted2)';
    b.style.borderColor = active ? 'var(--m1)' : 'var(--border2)';
    b.style.fontWeight = active ? '800' : '700';
  });
}
function applyCustomRange(){
  const f=document.getElementById('customDateFrom').value;
  const t=document.getElementById('customDateTo').value;
  if(!f||!t){ toast(L('⚠️ कृपया दोनों तारीखें चुनें','⚠️ Please select both dates')); return; }
  if(f>t){ toast(L('⚠️ शुरू की तारीख अंत से पहले होनी चाहिए','⚠️ Start date must be before end date')); return; }
  const days = Math.round((new Date(t)-new Date(f))/86400000)+1;
  if(days>366*5){ toast((typeof L==='function')?L('⚠️ अधिकतम 5 साल का range चुनें','⚠️ Maximum 5 years range'):'⚠️ Max 5 years'); return; }
  _customRangeActive=true; _customDateFrom=f; _customDateTo=t;
  document.getElementById('resetRangeBtn').style.display='';
  closeCustomRange();
  renderSchedule();
}
function resetCustomRange(){
  _customRangeActive=false; _customDateFrom=''; _customDateTo='';
  document.getElementById('resetRangeBtn').style.display='none';
  renderSchedule();
}

// ════════════════════════════════════════
// EXCEL UPLOAD
// ════════════════════════════════════════

/** Download Schedule Excel template: 10 sample employees + date/shift columns + Hindi/English notes */
function downloadScheduleExcelTemplate(){
  try{ toast('⬇️ Schedule template downloading…'); }catch(e){}
  // Fixed person columns — same order as Team Excel + Schedule export
  const FIXED = ['Name','Emp ID','Designation','Weekly Off','Mobile','Section','Machine','Responsibility','Salary','Joining Date','Date of Birth'];
  // 7 sample date columns (today-ish style labels)
  const base = new Date();
  const dates = [];
  for(let i=0;i<7;i++){
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate()+i);
    const lab = String(d.getDate()).padStart(2,'0')+'-'+d.toLocaleString('en',{month:'short'})+'-'+String(d.getFullYear()).slice(2);
    dates.push(lab);
  }
  const headers = FIXED.concat(dates);

  // 10 sample employees with varied shifts D/N/O
  const people = [
    ['RAHUL MEHTA','41001201','Team Member','MON','9810011223','Production A','Line-1','Operation','32000','12-03-2024','15-08-1995'],
    ['PRIYA SHARMA','41001202','Sr. Team Member','WED','9823344556','Production A','Line-1','Setup','38500','01-06-2023','22-11-1992'],
    ['AMIT KUMAR','41001203','Trainee','FRI','9876512340','Production B','Line-2','Assistant','21000','05-01-2026','03-04-2001'],
    ['NEHA GUPTA','41001204','Team Member','TUE','9900112233','Quality','QC-Desk','Inspection','29500','18-09-2024','09-07-1996'],
    ['VIKAS PATEL','41001205','Jr. Team Member','SAT','9911223344','Warehouse','Bay-3','Handling','26000','20-11-2025','11-02-1998'],
    ['SONIA VERMA','41001206','Operator','SUN','9922334455','Metalliser','M-1','Machine Op','28000','10-02-2024','21-09-1994'],
    ['RAJESH YADAV','41001207','Supervisor','MON','9933445566','Slitter','S-2','Supervision','42000','03-08-2022','14-01-1990'],
    ['KAVITA DEVI','41001208','Team Member','THU','9944556677','MetProd','Line-3','Packing','27000','19-05-2025','08-12-1997'],
    ['MOHAN SINGH','41001209','Helper','FRI','9955667788','Production A','Line-1','Helper','22000','22-07-2024','30-03-1999'],
    ['ANITA RANI','41001210','Team Member','WED','9966778899','Quality','QC-Desk','Checking','30000','11-11-2023','17-06-1993'],
  ];
  // Sample shift patterns (7 days)
  const patterns = [
    ['D','D','D','D','D','O','O'],
    ['N','N','N','N','N','O','O'],
    ['D','D','O','N','N','N','O'],
    ['O','D','D','D','D','D','O'],
    ['D','D','D','O','N','N','N'],
    ['N','N','O','D','D','D','D'],
    ['D','O','D','D','D','D','O'],
    ['O','O','D','D','D','D','D'],
    ['D','D','D','D','O','O','D'],
    ['N','N','N','O','O','D','D'],
  ];
  const dataRows = people.map((p,i)=> p.concat(patterns[i]));

  const esc = (v)=>{
    const s = String(v??'');
    return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  };

  // Notes below data (Hindi + English) — column purpose for the app
  const blank = ()=> Array(headers.length).fill('');
  const noteRows = [];
  const pushNote = (text)=>{
    const r = blank();
    r[0] = text;
    noteRows.push(r);
  };
  pushNote('');
  pushNote('========== NOTES / नोट (Hindi + English) — do not delete this section; app ignores rows without Emp ID ==========');
  pushNote('');
  pushNote('EN: You can fill whatever team information you need. Extra columns are optional; required ones help the app match people and shifts.');
  pushNote('HI: आप टीम की जो भी जानकारी देना चाहें दे सकते हैं। अतिरिक्त कॉलम वैकल्पिक हैं; ज़रूरी कॉलम से App लोगों और शिफ्ट को सही जोड़ती है।');
  pushNote('');
  pushNote('--- Column purpose / कॉलम का उद्देश्य ---');
  pushNote('Name | नाम: Employee full name (display in Schedule & Team).');
  pushNote('Emp ID | कर्मचारी कोड: REQUIRED to match rows when uploading shifts. Keep stable (do not change often).');
  pushNote('Designation | पद: Role title (Operator, Supervisor…). Not used as Section.');
  pushNote('Weekly Off | साप्ताहिक छुट्टी: MON–SUN preferred (or full day name).');
  pushNote('Mobile | मोबाइल: 10-digit number for WhatsApp / login link (optional but useful).');
  pushNote('Section | सेक्शन: REQUIRED for Home section-wise view (Metalliser, Slitter, Production A…). Free text — any industry.');
  pushNote('Machine | मशीन: Machine / line name (M-1, Line-1…). Used in filters & min staff.');
  pushNote('Responsibility | जिम्मेदारी: Job duty text (optional).');
  pushNote('Salary | वेतन: Monthly salary number (optional; for cost reports).');
  pushNote('Joining Date | जॉइनिंग: Optional date.');
  pushNote('Date of Birth | जन्म तिथि: Optional date.');
  pushNote('Date columns (01-Sep-26 …) | तारीख कॉलम: Shift codes only — D=Day, N=Night, O=Off, L=Leave, C/O=Comp Off, G=General, Ab=Absent, HLF=Half, GP=Gate Pass, H=Holiday, OD=Other Dept.');
  pushNote('');
  pushNote('EN: How to use — (1) Edit sample names/Emp IDs to your team OR delete sample rows and paste your people. (2) Fill shift cells under each date. (3) Upload this file in Schedule → Upload Excel. (4) For people/section only without shifts, use Team → Excel instead.');
  pushNote('HI: उपयोग — (1) सैंपल नाम/Emp ID अपनी टीम से बदलें या हटाकर अपनी सूची लगाएँ। (2) हर तारीख के नीचे शिफ्ट भरें (D/N/O…)। (3) Schedule → Upload Excel से अपलोड करें। (4) केवल लोग/सेक्शन अपडेट के लिए Team → Excel उपयोग करें।');
  pushNote('');
  pushNote('EN: Tip — Prefer Download Excel from Schedule (live data), edit shifts, re-upload. This template is only a starter with 10 example employees.');
  pushNote('HI: सुझाव — असली डेटा के लिए Schedule से Download Excel लें, शिफ्ट एडिट करें, फिर अपलोड करें। यह फ़ाइल सिर्फ 10 उदाहरण कर्मचारियों वाला टेम्पलेट है।');

  const allRows = [headers, ...dataRows, ...noteRows];
  const csv = allRows.map(r=>r.map(esc).join(',')).join('\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ManPower_Schedule_Template_10Emp.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 2000);
  try{ toast('✅ Template: 10 employees + dates + Hindi/English notes'); }catch(e){}
}
try{ window.downloadScheduleExcelTemplate = downloadScheduleExcelTemplate; }catch(e){}

function openExcelUpload(){
  try{ /* exposed for Schedule toolbar */ }catch(e){}
  document.getElementById('excelUploadOverlay').classList.add('open');
  document.getElementById('excelUploadStatus').style.display='none';
}
function closeExcelUpload(){
  document.getElementById('excelUploadOverlay').classList.remove('open');
}
try{ window.openExcelUpload = openExcelUpload; window.closeExcelUpload = closeExcelUpload; window.handleExcelFile = handleExcelFile; }catch(e){}
function handleExcelDrop(e){
  e.preventDefault();
  document.getElementById('excelUploadDropZone').style.borderColor='var(--border2)';
  const file=e.dataTransfer.files[0];
  if(file) handleExcelFile(file);
}
async function handleExcelFile(file){
  if(!file){ return; }
  const statusEl=document.getElementById('excelUploadStatus');
  statusEl.style.display='block';
  statusEl.innerHTML='<span style="color:var(--day)">⏳ फ़ाइल पढ़ी जा रही है...</span>';
  try{
    if(!window.XLSX){
      await new Promise((res,rej)=>{
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=res; s.onerror=rej; document.head.appendChild(s);
      });
    }
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
    if(!rows||rows.length<3){ statusEl.innerHTML='<span style="color:var(--lv)">❌ फ़ाइल में डेटा नहीं मिला</span>'; return; }

    const MONTHS={'january':1,'february':2,'march':3,'april':4,'may':5,'june':6,
                  'july':7,'august':8,'september':9,'october':10,'november':11,'december':12,
                  'jan':1,'feb':2,'mar':3,'apr':4,'jun':6,'jul':7,'aug':8,'sep':9,'oct':10,'nov':11,'dec':12};

    const schedByMonth={};
    let formatName='', empCount=0, savedMonths=[];

    // ══════════════════════════════════════════════
    // FORMAT A: HORIZONTAL ALL-MONTHS (your Man Power file)
    // Row 0: title cells "...Month December-2025..." at month-start cols
    // Row 1: day-of-week (MON, TUE...)  
    // Row 2: S.No | Name | EmpCode | W-OFF | ... | 1 | 2 | 3 ... (day numbers restart per month)
    // Row 3+: employee data — empId at col 2 (0-indexed)
    // ══════════════════════════════════════════════
    const titleRow = rows[0] || [];
    const dayNumRow = rows[2] || [];
    
    // Detect: does row 0 have month+year titles AND row 2 have integer day numbers?
    const titleCells = titleRow.map((c,i)=>({i,v:String(c||'')}))
      .filter(x=>x.v.match(/\b(20\d{2})\b/) && x.v.toLowerCase().match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/));
    const hasDayNums = dayNumRow.some(c=>{ const n=parseInt(String(c||'').trim()); return !isNaN(n)&&n>=1&&n<=31; });

    if(titleCells.length > 0 && hasDayNums){
      // ── HORIZONTAL FORMAT ──
      formatName = 'Man Power Horizontal All-Months Format';

      // EmpCode is always col index 2 (0-based: S.No=0, Name=1, EmpCode=2)
      const empCodeCol = 2;

      // Build month sections: { monthKey, year, month, startCol, endCol }
      const sections = [];
      titleCells.sort((a,b)=>a.i-b.i);
      titleCells.forEach((tc, idx)=>{
        const yearMatch = tc.v.match(/\b(20\d{2})\b/);
        const monMatch = tc.v.toLowerCase().match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/);
        if(!yearMatch||!monMatch) return;
        const year = parseInt(yearMatch[1]);
        const month = MONTHS[monMatch[1]];
        const monthKey = `${year}_${String(month).padStart(2,'0')}`;
        const startCol = tc.i;
        const endCol = idx+1 < titleCells.length ? titleCells[idx+1].i - 1 : rows[0].length - 1;
        sections.push({ monthKey, year, month, startCol, endCol });
      });

      // For each section, map col→dayIndex from the day-number header row (row index 2)
      sections.forEach(sec=>{
        const colToDayIdx = {};
        for(let c=sec.startCol; c<=sec.endCol; c++){
          const val = String(dayNumRow[c]||'').trim();
          const dayNum = parseInt(val);
          if(!isNaN(dayNum) && dayNum>=1 && dayNum<=31){
            colToDayIdx[c] = dayNum - 1; // 0-indexed
          }
        }
        sec.colToDayIdx = colToDayIdx;
        const daysInMonth = new Date(sec.year, sec.month, 0).getDate();
        sec.daysInMonth = daysInMonth;
      });

      // Normalize shift values
      const SH_NORM = {'C/O':'C/O','CO':'C/O','COFF':'C/O','C-OFF':'C/O',
                       'GP':'GP','HLF':'HLF','HALF':'HLF','H':'H','AB':'Ab','ABSENT':'Ab',
                       'OD':'OD','G':'G','GENERAL':'G','SL':'L','A':'A'};  // A = A-shift (not Absent)

      // Parse employee rows (row index 3 onwards)
      for(let r=3; r<rows.length; r++){
        const row = rows[r];
        const rawEmpId = String(row[empCodeCol]||'').trim().replace(/[^0-9A-Za-z]/g,'');
        if(!rawEmpId || isNaN(Number(rawEmpId))) continue; // skip non-employee rows

        sections.forEach(sec=>{
          if(!schedByMonth[sec.monthKey]) schedByMonth[sec.monthKey] = {};
          if(!schedByMonth[sec.monthKey][rawEmpId])
            schedByMonth[sec.monthKey][rawEmpId] = new Array(sec.daysInMonth).fill('');

          Object.entries(sec.colToDayIdx).forEach(([col, dayIdx])=>{
            if(dayIdx >= sec.daysInMonth) return;
            let sh = String(row[parseInt(col)]||'').trim().toUpperCase();
            sh = SH_NORM[sh] || sh;
            if(!sh) return; // blank cell → keep blank, do NOT default to 'O'
            if(['D','N','O','L','C/O','G','GP','HLF','H','Ab','OD'].includes(sh)||sh.length<=3){
              schedByMonth[sec.monthKey][rawEmpId][dayIdx] = sh;
            }
          });
        });
        empCount++;
      }

    } else {
      // ══════════════════════════════════════════════
      // FORMAT B: VERTICAL (date rows) or Man Power SECTION-BLOCKS
      // ══════════════════════════════════════════════
      const isSectionBlockFormat = rows.some(r=>r.some(c=>/e\.?\s*code/i.test(String(c||''))));

      if(isSectionBlockFormat){
        formatName = 'Man Power Section-Block Format';
        let i=0;
        while(i<rows.length){
          const row=rows[i];
          const rowText=row.map(c=>String(c||'')).join(' ');
          const yearMatch=rowText.match(/\b(20\d{2})\b/);
          const monMatch=rowText.toLowerCase().match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/);
          if(yearMatch && monMatch){
            const year=parseInt(yearMatch[1]);
            const month=MONTHS[monMatch[1]];
            const monthKey=`${year}_${String(month).padStart(2,'0')}`;
            const daysInMonth=new Date(year,month,0).getDate();
            let headerRow=null, headerRowIdx=-1;
            for(let h=i+1;h<Math.min(i+6,rows.length);h++){
              if(rows[h].some(c=>/e\.?\s*code/i.test(String(c||'')))){
                headerRow=rows[h]; headerRowIdx=h; break;
              }
            }
            if(!headerRow){ i++; continue; }
            let codeCol=-1; const dayColMap={};
            headerRow.forEach((cell,ci)=>{
              const s=String(cell||'').trim();
              if(/^e\.?\s*code$/i.test(s)) codeCol=ci;
              const d=parseInt(s); if(!isNaN(d)&&d>=1&&d<=31) dayColMap[d]=ci;
            });
            if(codeCol===-1||Object.keys(dayColMap).length===0){ i=headerRowIdx+1; continue; }
            let r=headerRowIdx+1;
            while(r<rows.length){
              const dr=rows[r];
              const empId=String(dr[codeCol]||'').trim().replace(/[^0-9A-Za-z]/g,'');
              if(!empId){ r++; break; }
              if(/s\.?\s*no/i.test(empId)||/name/i.test(empId)){ r++; continue; }
              if(!schedByMonth[monthKey]) schedByMonth[monthKey]={};
              if(!schedByMonth[monthKey][empId]) schedByMonth[monthKey][empId]=new Array(daysInMonth).fill('');
              Object.entries(dayColMap).forEach(([day,ci])=>{
                const dayIdx=parseInt(day)-1;
                if(dayIdx>=daysInMonth) return;
                let sh=String(dr[ci]||'').trim().toUpperCase();
                const shMap={'C/O':'C/O','CO':'C/O','GP':'GP','HLF':'HLF','AB':'Ab','OD':'OD','G':'G'};
                sh=shMap[sh]||sh;
                if(!sh) return; // blank cell → keep blank, do NOT default to 'O'
                schedByMonth[monthKey][empId][dayIdx]=sh;
              });
              empCount++; r++;
            }
            i=r;
          } else { i++; }
        }
      } else {
        // FORMAT C: Flat employee rows — Name | Emp ID | … | Section | Machine | … | 01-Jul-25 | 02-Jul-25 …
        // Same layout as Download Excel / Manager working file
        const headerRowIdx = rows.findIndex(r => {
          const cells = (r||[]).map(c=>String(c||'').trim().toLowerCase());
          const hasName = cells.some(c=>c==='name');
          const hasCode = cells.some(c=>/^(emp\s*id|e\s*code|emp\s*code|code)$/.test(c));
          return hasName && hasCode;
        });
        if(headerRowIdx >= 0){
          formatName = 'Flat Team+Schedule (Name / Emp ID / Section + dates)';
          const header = rows[headerRowIdx] || [];
          const norm = (s)=> String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
          let empCodeCol = -1, nameCol = -1;
          const dayColMap = {}; // colIndex → {year, month, day}
          const MONTH_ABBR = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
          header.forEach((cell, ci)=>{
            const n = norm(cell);
            if(n==='name') nameCol = ci;
            if(/^(emp id|e code|emp code|code|emp id)$/.test(n) || n==='empid') empCodeCol = ci;
            // Resolve date columns: Date objects, Excel serials, many string formats
            let dObj = null;
            if(cell instanceof Date && !isNaN(cell.getTime())){
              dObj = cell;
            } else if(typeof cell === 'number' && cell > 30000 && cell < 80000){
              // Excel serial date
              dObj = new Date(Math.round((cell - 25569) * 86400 * 1000));
            } else {
              const s = String(cell||'').trim();
              if(!s || /^(name|emp|section|machine|mobile|designation|salary|joining|birth|weekly|responsib)/i.test(s)) return;
              // 01-Jul-25 / 02-Oct-26 / 1 Oct 2026
              let m = s.match(/^(\d{1,2})[-/ .](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/ .](\d{2,4})$/i);
              if(m){
                let year = parseInt(m[3],10); if(year < 100) year += 2000;
                const month = MONTH_ABBR[m[2].toLowerCase().slice(0,3)];
                const day = parseInt(m[1],10);
                if(month && day) dayColMap[ci] = { year, month, day };
                return;
              }
              // 2025-07-01
              m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
              if(m){ dayColMap[ci] = { year:+m[1], month:+m[2], day:+m[3] }; return; }
              // 01-10-2026 or 01/10/2026 (prefer DD-MM-YYYY when day>12 or Indian style)
              m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
              if(m){
                let year = parseInt(m[3],10); if(year < 100) year += 2000;
                let a = parseInt(m[1],10), b = parseInt(m[2],10);
                let day, month;
                if(a > 12){ day = a; month = b; }           // 13-10-2026 → day 13
                else if(b > 12){ day = b; month = a; }      // 10-13-2026 → US style
                else { day = a; month = b; }                // default DD-MM (India)
                if(month>=1 && month<=12 && day>=1 && day<=31) dayColMap[ci] = { year, month, day };
                return;
              }
              // Locale date strings e.g. "Thu Oct 01 2026 ..."
              const tryD = new Date(s);
              if(!isNaN(tryD.getTime()) && tryD.getFullYear()>=2020 && tryD.getFullYear()<=2035){
                dObj = tryD;
              }
            }
            if(dObj){
              dayColMap[ci] = { year: dObj.getFullYear(), month: dObj.getMonth()+1, day: dObj.getDate() };
            }
          });
          if(empCodeCol < 0){
            // fallback: second column often Emp ID
            empCodeCol = 1;
          }
          console.log('[Excel upload] FORMAT C date columns:', Object.keys(dayColMap).length, dayColMap);
          const SH_NORM2 = {'C/O':'C/O','CO':'C/O','COFF':'C/O','C-OFF':'C/O','GP':'GP','HLF':'HLF','HALF':'HLF','H':'H','AB':'Ab','ABSENT':'Ab','OD':'OD','G':'G','GENERAL':'G','SL':'L'};
          for(let r = headerRowIdx + 1; r < rows.length; r++){
            // skip weekday-only helper row
            const row = rows[r];
            if(!row) continue;
            const codeRaw = String(row[empCodeCol]||'').trim();
            const empId = codeRaw.replace(/[^0-9A-Za-z]/g,'');
            if(!empId) continue;
            // skip pure weekday rows
            const first = String(row[0]||'').trim().toLowerCase();
            if(/^(sun|mon|tue|wed|thu|fri|sat)$/.test(first) && !String(row[empCodeCol]||'').trim()) continue;
            Object.entries(dayColMap).forEach(([col, dm])=>{
              const monthKey = dm.year + '_' + String(dm.month).padStart(2,'0');
              const dayIdx = dm.day - 1;
              const daysInMonth = new Date(dm.year, dm.month, 0).getDate();
              if(dayIdx < 0 || dayIdx >= daysInMonth) return;
              if(!schedByMonth[monthKey]) schedByMonth[monthKey] = {};
              if(!schedByMonth[monthKey][empId]) schedByMonth[monthKey][empId] = new Array(daysInMonth).fill('');
              let sh = String(row[parseInt(col,10)]||'').trim().toUpperCase();
              sh = SH_NORM2[sh] || sh;
              if(!sh) return;
              if(['D','N','O','L','C/O','G','GP','HLF','H','Ab','OD','A','B','C'].includes(sh) || sh.length <= 4){
                schedByMonth[monthKey][empId][dayIdx] = sh;
                empCount++;
              }
            });
          }
        } else {
          // Simple date-rows format (Date | Emp1 | Emp2 …)
          formatName = 'Simple Date-Row Format';
          const header=rows[0];
          const now=new Date();
          const cutoff=new Date(now.getFullYear(),now.getMonth()-12,1);
          const cutoffStr=cutoff.toISOString().split('T')[0];
          for(let r=1;r<rows.length;r++){
            const row=rows[r];
            if(!row||!row[0]) continue;
            let dateStr='';
            const raw=String(row[0]).trim();
            if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) dateStr=raw;
            else if(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(raw)){
              const p=raw.split(/[\/\-]/);
              dateStr=`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
            } else { const d=new Date(raw); if(!isNaN(d)) dateStr=d.toISOString().split('T')[0]; }
            if(!dateStr||dateStr<cutoffStr) continue;
            const monthKey=dateStr.substring(0,7).replace('-','_');
            const dayIdx=parseInt(dateStr.split('-')[2],10)-1;
            if(!schedByMonth[monthKey]) schedByMonth[monthKey]={};
            for(let c=1;c<header.length;c++){
              const empId=String(header[c]||'').trim();
              if(!empId) continue;
              const sh=String(row[c]||'O').trim().toUpperCase()||'O';
              if(!schedByMonth[monthKey][empId]) schedByMonth[monthKey][empId]=[];
              schedByMonth[monthKey][empId][dayIdx]=sh;
              empCount++;
            }
          }
        }
      }
    }

    const months=Object.keys(schedByMonth);
    if(months.length===0){
      statusEl.innerHTML=`<span style="color:var(--lv)">❌ कोई valid data नहीं मिला<br>
        <span style="color:var(--muted2)">Format detected: ${formatName||'Unknown'}<br>
        Expected: Man Power file with month titles in row 1, empCode in col 3</span></span>`;
      return;
    }

    statusEl.innerHTML=`<span style="color:var(--day)">⏳ Firebase में ${months.length} महीने save हो रहे हैं...</span>`;
    let saved=0;
    const saveErrors=[];
    // Build empId→internalId map for cross-saving
    const empIdToInternal={};
    getEmps().forEach(e=>{ if(e.empId) empIdToInternal[String(e.empId).trim()]=e.id; });

    // Ensure write auth before schedule saves
    try{
      if(typeof _ensureWriteAuth==='function'){
        const okAuth = await _ensureWriteAuth();
        if(!okAuth){
          statusEl.innerHTML='<span style="color:var(--lv)">❌ Phone OTP verify करें — फिर Upload दोबारा करें</span>';
          toast(L('❌ Write auth missing — OTP verify करें','❌ Write auth missing — verify OTP'));
          return;
        }
      }
    }catch(e){ console.warn('[upload auth]', e); }

    for(const mk of months){
      try{
        const existing=(getSchedules()[mk]||{});
        const merged={...existing};
        Object.entries(schedByMonth[mk]).forEach(([empId,shifts])=>{
          // Store as plain array of strings (Firebase RTDB friendly)
          const arr = Array.isArray(shifts) ? shifts.map(x => (x==null?'':String(x))) : [];
          merged[empId]=arr;
          const intId=empIdToInternal[empId] || empIdToInternal[String(empId).trim()];
          if(intId && intId!==empId) merged[intId]=arr;
        });
        // Prefer full month set; if fails try per-employee updates
        try{
          await fbSet('schedules/'+mk, merged);
        }catch(e1){
          console.warn('[upload] fbSet failed, trying per-emp', mk, e1&&e1.message);
          for(const [empId, arr] of Object.entries(merged)){
            try{ await fbSet('schedules/'+mk+'/'+empId, arr); }catch(e2){ throw e2; }
          }
        }
        try{
          if(!_cache.schedules) _cache.schedules = {};
          _cache.schedules[mk] = merged;
        }catch(e){}
        saved++; savedMonths.push(mk.replace('_','/'));
      }catch(e){
        console.error('Save error',mk,e);
        saveErrors.push(mk+': '+(e&&e.message?e.message:String(e)));
      }
    }

    if(saved===0){
      statusEl.innerHTML=`<span style="color:var(--lv)">❌ Schedule Firebase में save नहीं हुआ (0 महीने)<br>
        <span style="font-size:12px;color:var(--muted2)">Parsed months: ${months.join(', ')||'none'} · employees: ${Object.keys(schedByMonth[months[0]]||{}).length}<br>
        ${saveErrors.slice(0,3).join('<br>')||'Permission / network error — Console देखें'}</span></span>`;
      toast('❌ Schedule save failed — overrides NOT cleared');
      return; // DO NOT clear overrides if schedule did not save
    }

    // CRITICAL: clear overrides for every uploaded emp+date so Excel values win
    // (old auto-H overrides were hiding the correct D/N/G/O from schedule)
    let clearedOv = 0;
    try{
      const ovClear = {};
      const idToInternal = empIdToInternal;
      const internalToCodes = {};
      getEmps().forEach(e=>{
        if(e.id) internalToCodes[e.id] = e.id;
        if(e.empId) internalToCodes[String(e.empId).trim()] = e.id;
      });
      Object.entries(schedByMonth).forEach(([mk, byEmp])=>{
        const parts = mk.split('_');
        const year = parts[0];
        const month = parts[1];
        Object.entries(byEmp).forEach(([empKey, shifts])=>{
          const intId = idToInternal[empKey] || internalToCodes[empKey] || empKey;
          const arr = Array.isArray(shifts) ? shifts : [];
          for(let dayIdx = 0; dayIdx < arr.length; dayIdx++){
            if(arr[dayIdx] == null || arr[dayIdx] === '') continue;
            const dateStr = year + '-' + month + '-' + String(dayIdx + 1).padStart(2,'0');
            // Clear override for both emp code key and internal id key
            [empKey, intId].filter(Boolean).forEach(id=>{
              const k = id + '_' + dateStr;
              ovClear[k] = null;
            });
          }
        });
      });
      if(Object.keys(ovClear).length){
        await fbUpdate('overrides', ovClear);
        const oc = {...(getOverrides()||{})};
        Object.keys(ovClear).forEach(k=>{ delete oc[k]; });
        _cache.overrides = oc;
        clearedOv = Object.keys(ovClear).length;
      }
    }catch(e){ console.warn('[upload clear overrides]', e); }

    const empIds=[...new Set(Object.values(schedByMonth).flatMap(m=>Object.keys(m)))];
    statusEl.innerHTML=`<span style="color:var(--green)">✅ <b>${formatName}</b><br>
      📅 ${saved} महीने save: ${savedMonths.join(', ')}<br>
      👥 ${empIds.length} employees: ${empIds.slice(0,6).join(', ')}${empIds.length>6?'...':''}`
      +(clearedOv?`<br>🧹 ${clearedOv} old overrides cleared (H no longer blocks Excel)`:'')
      +(saveErrors.length?`<br><span style="color:var(--lv)">⚠️ Some months failed: ${saveErrors.slice(0,2).join('; ')}</span>`:'')
      +`</span>`;
    
    // Cancel approved leaves on days where Excel has a non-L duty (so L does not stick)
    // Do NOT cancel credit-only C-Off grants (holiday duty / double-shift earnings) — those are balance only.
    try{
      const leaves = getLeaves()||[];
      let leaveFixes = 0;
      for(const L of leaves){
        if(!L || L.status!=='approved') continue;
        if(L.credit === true || L.credit === 'true' || L.credit === 1) continue;
        const empKey = L.empId;
        // find if any uploaded day in range has duty
        let conflict = false;
        Object.entries(schedByMonth).forEach(([mk, byEmp])=>{
          const parts = mk.split('_');
          const year = parts[0], month = parts[1];
          const arr = byEmp[empKey] || (L.empObjId && byEmp[L.empObjId]) || null;
          // also try match via empIdToInternal inverse
          let row = arr;
          if(!row){
            Object.keys(byEmp).forEach(k=>{
              if(idToInternal[k]===empKey || k===empKey) row = byEmp[k];
            });
          }
          if(!row) return;
          for(let dayIdx=0; dayIdx<row.length; dayIdx++){
            const val = String(row[dayIdx]||'').toUpperCase();
            if(!val || val==='L' || val.indexOf('L:')===0) continue;
            const dateStr = year+'-'+month+'-'+String(dayIdx+1).padStart(2,'0');
            if(L.from<=dateStr && L.to>=dateStr) conflict = true;
          }
        });
        if(conflict && L._key){
          try{
            await fbUpdate('leaves/'+L._key, { status:'cancelled', cancelReason:'schedule_excel_upload', cancelledAt:new Date().toISOString() });
            leaveFixes++;
          }catch(e){}
        }
      }
      if(leaveFixes){
        try{
          const allL = await fbGet('leaves');
          if(allL) _cache.leaves = Object.entries(allL).map(([k,v])=>({...v,_key:k}));
        }catch(e){}
      }
      if(leaveFixes) toast('🧹 '+leaveFixes+' leave(s) cleared where Excel has duty');
    }catch(e){ console.warn('[upload leave clear]', e); }

    toast('✅ Shift schedule uploaded'+(clearedOv?' · old overrides cleared':''));
    try{ renderSchedule(); }catch(e){}
    try{ if(typeof renderHome==='function') renderHome(); }catch(e){}
  }catch(err){
    console.error('Excel parse error:',err);
    statusEl.innerHTML=`<span style="color:var(--lv)">❌ Error: ${err.message}</span>`;
  }
}

// ════════════════════════════════════════
// SMS NOTIFICATION ENGINE (Fast2SMS)
// ════════════════════════════════════════
let _smsSettings = { apiKey:'', enabled:false };

async function loadSmsSettings(){
  try{
    const s = await fbGet('smsSettings');
    if(s){ _smsSettings = { apiKey: s.apiKey||'', enabled: s.enabled===true }; }
  }catch(e){}
}

async function saveSmsSettings(){
  const key = document.getElementById('smsApiKey').value.trim();
  const enabled = document.getElementById('smsEnabled').checked;
  if(!key){ toast(L('⚠️ API Key खाली है','⚠️ API Key is empty')); return; }
  _smsSettings = { apiKey: key, enabled };
  try{
    await fbSet('smsSettings', { apiKey: key, enabled });
    closeSmsSettings();
    toast(L('✅ SMS Settings save हो गई','✅ SMS Settings saved'));
  }catch(e){ toast('❌ Save error: '+e.message); }
}

function openSmsSettings(){
  loadSmsSettings().then(()=>{
    document.getElementById('smsApiKey').value = _smsSettings.apiKey || '';
    document.getElementById('smsEnabled').checked = _smsSettings.enabled;
    document.getElementById('smsTestStatus').style.display='none';
    document.getElementById('smsSettingsOverlay').classList.add('open');
  });
}
function closeSmsSettings(){
  document.getElementById('smsSettingsOverlay').classList.remove('open');
}

async function testSmsApi(){
  const key = document.getElementById('smsApiKey').value.trim();
  const phone = document.getElementById('smsTestPhone').value.trim();
  const statusEl = document.getElementById('smsTestStatus');
  if(!key){ toast(L('⚠️ पहले API Key डालें','⚠️ Enter API Key first')); return; }
  if(!phone||phone.length!==10){ toast(L('⚠️ सही 10 अंक का नंबर डालें','⚠️ Enter a valid 10-digit number')); return; }
  statusEl.style.display='block';
  statusEl.style.background='rgba(251,191,36,.08)';
  statusEl.style.border='1px solid rgba(251,191,36,.3)';
  statusEl.style.color='var(--day)';
  statusEl.textContent='⏳ Test SMS भेजा जा रहा है...';
  const result = await sendFast2Sms(key, phone, 'Man Power Test: SMS notification system सही काम कर रहा है! ✅');
  if(result.ok){
    statusEl.style.background='rgba(34,197,94,.08)';
    statusEl.style.border='1px solid rgba(34,197,94,.3)';
    statusEl.style.color='var(--green)';
    statusEl.textContent='✅ Test SMS सफलतापूर्वक भेजा गया!';
  } else {
    statusEl.style.background='rgba(244,63,94,.08)';
    statusEl.style.border='1px solid rgba(244,63,94,.3)';
    statusEl.style.color='var(--lv)';
    statusEl.textContent='❌ Error: '+(result.error||'Unknown error');
  }
}

async function sendFast2Sms(apiKey, phone, message){
  // ── SECURE: Try Cloud Function first (API key stays on server) ──
  try{
    const result = await window._fbCall('sendSms', { phone, message });
    if(result.data && result.data.success) return { ok:true };
    return { ok:false, error: 'Server SMS failed' };
  }catch(cfErr){
    console.warn('[sendSms] Cloud Function error, trying direct:', cfErr.message);
    // Fallback: direct API call (only works if apiKey is provided)
    if(!apiKey) return { ok:false, error: 'SMS service unavailable' };
    try{
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=q&message=${encodeURIComponent(message)}&flash=0&numbers=${phone}`;
      const resp = await fetch(url, { method:'GET' });
      const data = await resp.json();
      if(data.return===true || data.status_code===200) return { ok:true };
      return { ok:false, error: (data.message||JSON.stringify(data)).substring(0,80) };
    }catch(e){
      return { ok:false, error: e.message };
    }
  }
}

// Build the SMS message for a shift change
function buildShiftSms(empName, date, shift){
  const shiftNames = { D:'Day Shift (7AM-7PM)', N:'Night Shift (7PM-7AM)', A:'A Shift', B:'B Shift', C:'C Shift', O:'Weekly Off', L:'Leave', G:'General Shift', 'C/O':'Compensatory Off', HLF:'Half Day', Ab:'Absent' };
  const shiftLabel = shiftNames[shift] || shift;
  const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  return `Man Power MP System:
Priy ${empName},
Aapki ${fmtD} ki shift update hui:
${shiftLabel}
Koi sawal ho to supervisor se mile.
-Man Power System`;
}

// SMS removed — WhatsApp used instead (free)
// sendShiftSms kept as stub to avoid any reference errors
async function sendShiftSms(empId, date, newShift){
  // No-op: WhatsApp notifications sent from saveAllShiftChanges instead
}

// ════════════════════════════════════════
// STICKY HEADER HEIGHT SYNC
// ════════════════════════════════════════
function syncStickyTop(){
  try{
    const hdr = document.querySelector('.hdr') || document.getElementById('appHdr');
    const h = hdr ? hdr.offsetHeight : 56;
    document.documentElement.style.setProperty('--hdr-height', h + 'px');

    // Mobile bottom/top nav; desktop nav is hidden
    const nav = document.querySelector('.nav');
    let navH = 0;
    if(nav){
      const st = window.getComputedStyle(nav);
      if(st.display !== 'none' && st.visibility !== 'hidden') navH = nav.offsetHeight || 0;
    }
    document.documentElement.style.setProperty('--nav-height', navH + 'px');

    // Learn bar (purple) is inside .hdr on most builds — already in h
    // Sticky block = filters + month + date (single unit)
    const stickyHdr = document.getElementById('schedStickyHdr');
    const sh = stickyHdr ? stickyHdr.offsetHeight : 48;
    document.documentElement.style.setProperty('--sched-sticky-h', sh + 'px');

    // Desktop: only header; mobile: header + nav
    const stickTop = h + navH;
    document.documentElement.style.setProperty('--sched-stick-top', stickTop + 'px');

    if(stickyHdr){
      stickyHdr.style.position = 'sticky';
      stickyHdr.style.top = stickTop + 'px';
      stickyHdr.style.zIndex = '40';
      stickyHdr.style.background = getComputedStyle(document.body).getPropertyValue('--bg2') || 'var(--bg2)';
    }
    // Nested date wrap must NOT be independently sticky (causes collapse)
    const dateWrap = document.getElementById('schedDateHdrWrap');
    if(dateWrap){
      dateWrap.style.position = 'relative';
      dateWrap.style.top = 'auto';
      dateWrap.style.zIndex = '1';
    }

    document.querySelectorAll('.sched-tbl th').forEach(th=>{
      th.style.top = stickTop + 'px';
    });
  }catch(e){ console.warn('[syncStickyTop]', e); }
}
let _schedResizeTimer = null;
let _lastSchedDayCount = 0;
function _onSchedLayoutChange(){
  syncStickyTop();
  clearTimeout(_schedResizeTimer);
  _schedResizeTimer = setTimeout(()=>{
    try{
      const n = (typeof _schedDayCount==='function') ? _schedDayCount() : 11;
      const tab = document.getElementById('tab-schedule');
      const onSched = tab && tab.classList.contains('on');
      if(onSched && n !== _lastSchedDayCount && typeof renderSchedule==='function'){
        _lastSchedDayCount = n;
        renderSchedule();
      } else {
        _alignSchedColumns();
        syncStickyTop();
      }
    }catch(e){
      try{ _alignSchedColumns(); syncStickyTop(); }catch(x){}
    }
  }, 180);
}
window.addEventListener('resize', _onSchedLayoutChange);
window.addEventListener('orientationchange', ()=>{
  try{ _unlockOrientation(); }catch(e){}
  setTimeout(_onSchedLayoutChange, 100);
  setTimeout(_onSchedLayoutChange, 300);
  setTimeout(_onSchedLayoutChange, 700);
  // Force visual viewport reflow on Android Chrome / PWA
  setTimeout(()=>{
    try{
      document.documentElement.style.width = '100%';
      window.dispatchEvent(new Event('resize'));
    }catch(e){}
  }, 400);
});
// Some Android PWAs only fire resize, not orientationchange
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', ()=>{
    clearTimeout(window._vvTimer);
    window._vvTimer = setTimeout(()=>{ try{ _onSchedLayoutChange(); }catch(e){} }, 200);
  });
}
document.addEventListener('DOMContentLoaded', syncStickyTop);
setTimeout(syncStickyTop, 500);

// ════════════════════════════════════════
// ADMIN TOOLBAR: hide Create/Upload/Print/Excel while scrolling schedule
// ════════════════════════════════════════
let _schedAdminCollapsed = false;
let _schedAdminLastScrollY = 0;
let _schedAdminBound = false;

function _setSchedAdminCollapsed(hide){
  const row = document.getElementById('schedAdminRow');
  if(!row) return;
  // Only collapse when the row is actually shown for editors
  if(row.style.display === 'none') return;
  const want = !!hide;
  if(want === _schedAdminCollapsed && row.classList.contains('sched-admin-collapsed') === want) return;
  _schedAdminCollapsed = want;
  if(want) row.classList.add('sched-admin-collapsed');
  else row.classList.remove('sched-admin-collapsed');
  // Recalc sticky tops after height change
  try{ if(!_setSchedAdminCollapsed._stickyT){ _setSchedAdminCollapsed._stickyT=setTimeout(()=>{_setSchedAdminCollapsed._stickyT=null; try{syncStickyTop();}catch(x){}}, 120);} }catch(e){}
}

function _onSchedContentScroll(e){
  // rAF-throttle: one update per frame max (scroll can fire 60+/sec)
  if(_onSchedContentScroll._raf) return;
  _onSchedContentScroll._raf = requestAnimationFrame(function(){
    _onSchedContentScroll._raf = 0;
    try{
      const tab = document.getElementById('tab-schedule');
      if(!tab || !tab.classList.contains('on')) return;
      const t = e && e.currentTarget ? e.currentTarget : null;
      let scrollTop = 0;
      if(t && typeof t.scrollTop === 'number') scrollTop = t.scrollTop;
      else scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if(scrollTop > 48) _setSchedAdminCollapsed(true);
      else if(scrollTop <= 12) _setSchedAdminCollapsed(false);
      _schedAdminLastScrollY = scrollTop;
    }catch(err){}
  });
}

function _bindSchedAdminScrollCollapse(){
  if(_schedAdminBound) return;
  _schedAdminBound = true;
  const wrap = document.getElementById('schedWrap');
  if(wrap){
    wrap.addEventListener('scroll', _onSchedContentScroll, {passive:true});
  }
  // Also react to page/body scroll (some layouts scroll the document, not only #schedWrap)
  window.addEventListener('scroll', _onSchedContentScroll, {passive:true});
  document.addEventListener('scroll', _onSchedContentScroll, {passive:true, capture:true});
}

function _resetSchedAdminCollapse(){
  _schedAdminCollapsed = false;
  const row = document.getElementById('schedAdminRow');
  if(row) row.classList.remove('sched-admin-collapsed');
}

try{ _bindSchedAdminScrollCollapse(); }catch(e){}
document.addEventListener('DOMContentLoaded', ()=>{ try{ _bindSchedAdminScrollCollapse(); }catch(e){} });
try{ window._setSchedAdminCollapsed = _setSchedAdminCollapsed; window._resetSchedAdminCollapse = _resetSchedAdminCollapse; }catch(e){}

// ════════════════════════════════════════
// MULTI-CELL SELECTION (drag or tap-select)
// ════════════════════════════════════════
let _msActive = false;          // selection mode on/off
let _msDragging = false;        // finger currently dragging
let _msSelected = new Set();    // Set of "empId|date" strings
let _msDragStartCell = null;
let _msLongPressTimer = null;

// Each cell tap goes here first
function setSchedEditMode(on){
  // Members without schedule permission cannot enter Edit on team Schedule
  if(typeof canEditSchedule==='function' && !canEditSchedule()){
    on = false;
  } else {
    // Managers/admins: always editable — ignore View mode
    on = true;
  }
  window._schedEditMode = !!on;
  const v = document.getElementById('schModeView');
  const e = document.getElementById('schModeEdit');
  const hint = document.getElementById('schedEditHint');
  if(v) v.classList.toggle('on', !on);
  if(e) e.classList.toggle('on', !!on);
  if(hint) hint.style.display = on ? 'block' : 'none';
  if(!on && typeof clearMultiSelect==='function'){ try{ clearMultiSelect(); }catch(x){} }
  if(typeof renderSchedule==='function') renderSchedule();
}
function closeSchedMoreMenu(){
  const m = document.getElementById('schedMoreMenu');
  if(m) m.style.display = 'none';
}
try{ window.setSchedEditMode=setSchedEditMode; window.toggleSchedMoreMenu=toggleSchedMoreMenu; window.closeSchedMoreMenu=closeSchedMoreMenu; }catch(e){}

function handleSchedCellClick(td, empId, empName, date, origSh){
  if(!canEditSchedule()) return; // workers cannot edit
  if(!window._schedEditMode && !_msActive){
    const sh = origSh || (td && td.getAttribute('data-origsh')) || '';
    if(['L','CO','C/O','OD','Ab','HLF'].includes(sh) && typeof showShiftInfo==='function'){
      showShiftInfo(empId, empName, date, sh);
    } else {
      try{ toast(L('शिफ्ट बदलने के लिए Edit मोड चुनें','Switch to Edit to change shifts')); }catch(e){}
    }
    return;
  }
  if(_msActive){
    _msToggleCell(td, empId, date);
    return;
  }
  editShiftCell(empId, empName, date, origSh);
}

// ── Show Leave/CO/OD reason on cell click (for all users) ──
function showShiftInfo(empId, empName, date, shiftVal){
  const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric',weekday:'long'});
  const shiftNames = {D:'Day Shift',N:'Night Shift',A:'A Shift',B:'B Shift',C:'C Shift',O:'Weekly Off',L:'Leave',G:'General','C/O':'Comp Off',CO:'Comp Off',HLF:'Half Day',Ab:'Absent',GP:'Gate Pass',H:'Holiday',OD:'Other Dept'};
  
  // Search for leave record
  const leaves = getLeaves().filter(l => l.empId===empId && l.status!=='rejected' && l.from<=date && l.to>=date);
  const leave = leaves.length ? leaves[0] : null;
  
  // Search for override with reason (comp-off, OD etc.)
  const overrides = getOverrides();
  const ovKey = empId+'_'+date;
  const override = overrides[ovKey];
  
  // Check for comp-off data
  let compOffInfo = null;
  if(shiftVal === 'CO' || shiftVal === 'C/O'){
    // comp-off reasons stored in leaves with leaveType containing 'C-Off' or 'Comp'
    const coLeave = getLeaves().find(l => l.empId===empId && l.from<=date && l.to>=date && (l.leaveType||'').match(/C-Off|Comp|CO/i));
    if(coLeave) compOffInfo = coLeave;
  }
  
  let reasonHtml = '';
  if(leave && leave.reason){
    reasonHtml += `<div style="margin-top:12px;padding:12px 14px;background:rgba(244,63,94,.08);border-left:3px solid var(--lv);border-radius:0 10px 10px 0">
      <div style="font-size:11px;color:var(--lv);font-weight:800;margin-bottom:4px">📝 कारण (Reason)</div>
      <div style="font-size:14px;color:var(--text);font-weight:600;line-height:1.5">${escHtml(leave.reason)}</div>
    </div>`;
    if(leave.leaveType){
      reasonHtml += `<div style="margin-top:8px;font-size:12px;color:var(--muted2)">🏷️ प्रकार: <b style="color:var(--day)">${escHtml(leave.leaveType)}</b></div>`;
    }
    if(leave.coffDate){
      reasonHtml += `<div style="margin-top:4px;font-size:12px;color:var(--muted2)">📅 Shift Date: <b style="color:var(--m1)">${leave.coffDate}</b></div>`;
    }
    if(leave.markedBy){
      reasonHtml += `<div style="margin-top:4px;font-size:12px;color:var(--muted2)">👤 Marked by: <b>${escHtml(leave.markedBy)}</b></div>`;
    }
    if(leave.appliedAt){
      reasonHtml += `<div style="margin-top:4px;font-size:11px;color:var(--muted)">🕐 ${new Date(leave.appliedAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN'))}</div>`;
    }
    if(leave.attachment){
      reasonHtml += `<div style="margin-top:8px"><img src="${leave.attachment}" style="max-width:100%;max-height:200px;border-radius:10px;border:1px solid var(--border2);cursor:pointer" onclick="window.open(this.src,'_blank')"></div>`;
    }
  } else if(compOffInfo && compOffInfo.reason){
    reasonHtml += `<div style="margin-top:12px;padding:12px 14px;background:rgba(250,204,21,.08);border-left:3px solid var(--co);border-radius:0 10px 10px 0">
      <div style="font-size:11px;color:var(--co);font-weight:800;margin-bottom:4px">📝 C-Off कारण</div>
      <div style="font-size:14px;color:var(--text);font-weight:600;line-height:1.5">${escHtml(compOffInfo.reason)}</div>
    </div>`;
    if(compOffInfo.coffDate){
      reasonHtml += `<div style="margin-top:4px;font-size:12px;color:var(--muted2)">📅 Shift Date: <b style="color:var(--m1)">${compOffInfo.coffDate}</b></div>`;
    }
  } else {
    reasonHtml += `<div style="margin-top:12px;padding:10px 14px;background:rgba(148,163,184,.08);border-radius:10px;text-align:center">
      <div style="font-size:13px;color:var(--muted2)">📝 कोई कारण उपलब्ध नहीं है</div>
    </div>`;
  }
  
  openModal(`<div class="modal-handle"></div>
    <div style="text-align:center;padding:8px 0 4px">
      <div class="shc ${cellClass(shiftVal)}" style="width:44px;height:36px;font-size:18px;margin:0 auto 8px">${cellDisp(shiftVal)}</div>
      <div class="modal-title" style="margin-bottom:2px">${shiftNames[shiftVal]||shiftVal}</div>
      <div style="font-size:16px;font-weight:800;color:var(--text)">${escHtml(empName)}</div>
      <div style="font-size:13px;color:var(--muted2);margin-top:2px">${fmtD}</div>
    </div>
    ${reasonHtml}
    <button class="cancel-btn" style="margin-top:16px" onclick="closeModal()">बंद करें</button>`);
}

// Touch start — start long-press timer to enter selection mode
function _msOnTouchStart(e){
  if(!isAdminOrMgr()) return;
  const td = e.target.closest('td[data-empid]');
  if(!td) return;
  _msDragStartCell = td;
  _msLongPressTimer = setTimeout(()=>{
    // Long press (400ms) → enter selection mode
    navigator.vibrate && navigator.vibrate(40);
    _msActive = true;
    _msDragging = true;
    _msSelected.clear();
    _msToggleCell(td, td.dataset.empid, td.dataset.date);
  }, 400);
}

function _msOnTouchMove(e){
  if(!_msDragging) { clearTimeout(_msLongPressTimer); return; }
  e.preventDefault(); // prevent scroll during drag
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if(!el) return;
  const td = el.closest('td[data-empid]');
  if(td && !_msSelected.has(td.dataset.empid+'|'+td.dataset.date)){
    _msToggleCell(td, td.dataset.empid, td.dataset.date);
  }
}

function _msOnTouchEnd(e){
  clearTimeout(_msLongPressTimer);
  _msDragging = false;
  // If active but 0 selected somehow, deactivate
  if(_msActive && _msSelected.size === 0) _msActive = false;
}

function _msToggleCell(td, empId, date){
  const key = empId+'|'+date;
  if(_msSelected.has(key)){
    _msSelected.delete(key);
    td.classList.remove('cell-selected');
  } else {
    _msSelected.add(key);
    td.classList.add('cell-selected');
  }
  _msUpdateBar();
}

function _msUpdateBar(){
  const bar = document.getElementById('multiSelectBar');
  const cnt = document.getElementById('msCount');
  if(!bar) return;
  if(_msSelected.size === 0 || !_msActive){
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  cnt.textContent = `${_msSelected.size} cell${_msSelected.size>1?'s':''} चुने`;
  if(typeof _updateMultiSelectShiftButtons==='function') _updateMultiSelectShiftButtons();

  // ── Position dynamically above Save bar if it's visible ──
  const saveBar = document.getElementById('schedSaveBar');
  const saveBarVisible = saveBar && saveBar.offsetParent !== null && saveBar.style.display !== 'none';
  if(saveBarVisible){
    const saveBarHeight = saveBar.offsetHeight || 220;
    bar.style.bottom = (saveBarHeight + 20) + 'px';
  } else {
    bar.style.bottom = '100px';
  }
}

function clearMultiSelect(){
  // v2.4.15: Instant UI feedback first — hide bar before heavy class cleanup
  // (especially important when many cells selected + browser pinch-zoom)
  _msActive = false;
  _msDragging = false;
  const keys = _msSelected.size;
  _msSelected.clear();

  const bar = document.getElementById('multiSelectBar');
  if(bar){
    bar.style.display = 'none';
    bar.style.pointerEvents = 'none';
  }
  const btn = document.getElementById('msToggleBtn');
  if(btn){
    btn.classList.remove('ms-on');
    btn.style.background='rgba(167,139,250,.06)';
    btn.style.borderColor='rgba(167,139,250,.4)';
    btn.textContent=L('☑️ Multi-Select','☑️ Multi-Select');
  }

  // Defer paint-heavy class removal so Cancel feels instant
  const clearCells = ()=>{
    try{
      // Prefer scoped query; fall back to keys stored on cells via data attrs
      const root = document.getElementById('schedTbl') || document;
      const nodes = root.querySelectorAll('td.cell-selected');
      // Batch: toggle a parent class first (cheap), then strip per-cell
      if(root.classList) root.classList.add('ms-clearing');
      for(let i=0;i<nodes.length;i++) nodes[i].classList.remove('cell-selected');
      if(root.classList) root.classList.remove('ms-clearing');
    }catch(e){
      try{ document.querySelectorAll('.cell-selected').forEach(td=>td.classList.remove('cell-selected')); }catch(x){}
    }
    if(bar) bar.style.pointerEvents = '';
  };
  if(keys > 12 && typeof requestAnimationFrame==='function'){
    requestAnimationFrame(()=>{ requestAnimationFrame(clearCells); });
  } else {
    clearCells();
  }
}


/** Hide A/B/C or D/N on multi-select bar per Profile shift settings */
function _updateMultiSelectShiftButtons(){
  try{
    const cfg = (typeof getShiftConfigSync==='function' ? getShiftConfigSync() : {}) || {};
    const hideABC = false; // controlled by shift active ticks only
    const hideDN = false;
    document.querySelectorAll('#multiSelectBar .ms-shift-abc').forEach(btn=>{
      btn.style.display = hideABC ? 'none' : '';
    });
    document.querySelectorAll('#multiSelectBar .ms-shift-dn').forEach(btn=>{
      btn.style.display = hideDN ? 'none' : '';
    });
    // Also hide inactive shifts from config
    const byCode = {};
    (cfg.shifts||[]).forEach(s=>{ if(s&&s.code) byCode[String(s.code).toUpperCase()] = s; });
    document.querySelectorAll('#multiSelectBar .ms-btn[data-shift]').forEach(btn=>{
      const code = (btn.getAttribute('data-shift')||'').toUpperCase();
      const s = byCode[code];
      if(s && s.active === false) btn.style.display = 'none';
    });
  }catch(e){ console.warn('[ms shift filter]', e); }
}

function toggleSelectMode(){
  if(!canEditSchedule()){ toast(L('❌ Schedule edit permission नहीं है','❌ No schedule edit permission')); return; }
  if(_msActive){ clearMultiSelect(); return; }
  _msActive = true;
  const btn = document.getElementById('msToggleBtn');
  if(btn){
    btn.classList.add('ms-on');
    btn.style.background='rgba(167,139,250,.35)';
    btn.style.borderColor='#a78bfa';
    btn.textContent=L('✕ Cancel Select','✕ Cancel Select');
  }
  toast('☑️ Select Mode ON — tap cells, then choose shift');
  _updateMultiSelectShiftButtons();
  _msAttachEvents();
}

function applyMultiShift(shiftVal){
  if(!canEditSchedule()){ toast(L('❌ Schedule edit permission नहीं है','❌ No schedule edit permission')); return; }
  if(!_msSelected.size) return;
  if(shiftVal === 'L'){
    // L needs reason — show reason modal for bulk
    _msBulkLeaveReason(shiftVal);
    return;
  }
  _msCommit(shiftVal, null);
}

function _msBulkLeaveReason(shiftVal){
  const count = _msSelected.size;
  const QUICK = ['Casual Leave (CL)','Sick Leave (SL)','Emergency Leave','Earned Leave (EL)','Personal Work','Family Function','Medical','Bereavement'];
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🌴 Leave का कारण</div>
    <div style="text-align:center;padding:4px 0 12px;font-size:13px;color:var(--muted2)">${count} दिनों के लिए Leave mark होगी</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px" id="blrChips">
      ${QUICK.map(r=>`<button type="button" onclick="selectBLRChip(this,'${r}')"
        style="padding:7px 12px;border-radius:20px;border:1.5px solid var(--border2);
        background:var(--card);color:var(--muted2);font-size:12px;font-weight:700;
        cursor:pointer;font-family:inherit;white-space:nowrap">${r}</button>`).join('')}
    </div>
    <div class="field" style="margin-bottom:4px">
      <label style="color:var(--lv)">कारण * (अनिवार्य)</label>
      <textarea id="blrText" rows="2"
        style="width:100%;padding:10px;background:var(--card);border:2px solid rgba(244,63,94,.3);
        border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;resize:none;outline:none"
        placeholder="Leave का कारण लिखें..."
        oninput="this.style.borderColor=this.value.trim()?'var(--border2)':'rgba(244,63,94,.3)'"></textarea>
    </div>
    <div class="field" style="margin-bottom:4px">
      <label style="color:var(--muted2);font-size:12px">📎 Document / Photo (Optional)</label>
      <div id="blrImgPreview" style="margin-bottom:6px"></div>
      <div style="display:flex;gap:6px">
        <button type="button" onclick="document.getElementById('blrCamInput').click()"
          style="flex:1;padding:10px;border:1.5px dashed var(--border2);border-radius:10px;
          background:transparent;color:var(--muted2);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          📸 Camera
        </button>
        <button type="button" onclick="document.getElementById('blrFileInput').click()"
          style="flex:1;padding:10px;border:1.5px dashed var(--border2);border-radius:10px;
          background:transparent;color:var(--muted2);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          🖼️ Gallery/File
        </button>
      </div>
      <input type="file" id="blrCamInput" accept="image/*" capture="environment" style="display:none" onchange="previewLeaveImg(this,'blrImgPreview')">
      <input type="file" id="blrFileInput" accept="image/*,.pdf" style="display:none" onchange="previewLeaveImg(this,'blrImgPreview')">
    </div>
    <button class="submit-btn" style="margin-top:10px" onclick="confirmBulkLeave()">✅ ${count} दिन Leave Mark करें</button>
    <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

function selectBLRChip(btn, reason){
  document.querySelectorAll('#blrChips button').forEach(b=>{
    b.style.background='var(--card)'; b.style.color='var(--muted2)'; b.style.borderColor='var(--border2)';
  });
  btn.style.background='rgba(244,63,94,.12)'; btn.style.color='var(--lv)'; btn.style.borderColor='var(--lv)';
  const ta=document.getElementById('blrText');
  if(ta){ ta.value=reason; ta.style.borderColor='var(--border2)'; }
}

function confirmBulkLeave(){
  const reason=(document.getElementById('blrText')||{}).value?.trim();
  if(!reason){
    const ta=document.getElementById('blrText');
    if(ta){ ta.style.borderColor='var(--lv)'; ta.focus(); }
    toast(L('⚠️ कारण लिखना अनिवार्य है','⚠️ Reason is required')); return;
  }
  const attachment=_leaveImgBase64||null;
  _leaveImgBase64=null;
  closeModal();
  _msCommit('L', reason, attachment);
}

function _msCommit(shiftVal, leaveReason, attachment){
  if(!canEditSchedule()){ toast(L('❌ Schedule edit permission नहीं है','❌ No schedule edit permission')); clearMultiSelect(); return; }
  const cells = [..._msSelected];
  for(const key of cells){
    const [empId, date] = key.split('|');
    const emp = getEmps().find(e=>e.id===empId);
    if(!emp) continue;
    const origSh = getShift(emp, date);
    stageSingleShiftChange(empId, emp.name, date, origSh, shiftVal);
    // If L with reason, also create leave record
    if(shiftVal === 'L' && leaveReason){
      const leaveData={
        empId, empName: emp.name,
        section: emp.sec||'',
        from:date, to:date, days:1,
        leaveType:'Admin Marked', reason: leaveReason,
        status:'approved',
        appliedAt: new Date().toISOString(),
        markedBy: SESSION.name||'Admin',
        reallocations:[]
      };
      if(attachment) leaveData.attachment=attachment;
      fbPush('leaves',leaveData).catch(()=>{});
    }
  }
  clearMultiSelect();
  toast(L('✅ ','✅ ') + cells.length + L(' cells में ',' cells set to ') + shiftVal);
}

// Attach touch events to schedule table after render
function _msAttachEvents(){
  const tbl = document.getElementById('schedTbl');
  if(!tbl || tbl._msEventsAttached) return;
  tbl._msEventsAttached = true;
  // Touch (mobile)
  tbl.addEventListener('touchstart', _msOnTouchStart, {passive:true});
  tbl.addEventListener('touchmove', _msOnTouchMove, {passive:false});
  tbl.addEventListener('touchend', _msOnTouchEnd, {passive:true});
  // Mouse (laptop/desktop)
  tbl.addEventListener('mousedown', _msOnMouseDown);
  tbl.addEventListener('mousemove', _msOnMouseMove);
  tbl.addEventListener('mouseup',   _msOnMouseUp);
  tbl.addEventListener('mouseleave',_msOnMouseUp);
  tbl.addEventListener('click',     _msOnClick, true); // capture phase to suppress before onclick
}

// ── DESKTOP MOUSE DRAG MULTI-SELECT ──
// Single click  → shift picker (normal)
// Click + drag  → multi-select (drag threshold: 6px)
let _msDragMouseActive = false;  // currently dragging in multi-select
let _msDragStartX = 0;
let _msDragStartY = 0;
let _msDragStartTd = null;
let _msDragOccurred = false;     // flag: suppress next click if drag happened
const _MS_DRAG_THRESHOLD = 6;   // pixels before drag mode kicks in

function _msOnMouseDown(e){
  if(e.button !== 0) return;                     // left button only
  const td = e.target.closest('td[data-empid]');
  if(!td) return;
  if(!isAdminOrMgr()) return;

  if(_msActive){
    // Already in multi-select mode → start drag-adding immediately
    _msDragMouseActive = true;
    _msDragOccurred = false;
    _msDragStartX = e.clientX;
    _msDragStartY = e.clientY;
    _msDragStartTd = td;
    _msToggleCell(td, td.dataset.empid, td.dataset.date);
    e.preventDefault();
    return;
  }

  // Normal mode — record position; wait to see if user drags
  _msDragStartX = e.clientX;
  _msDragStartY = e.clientY;
  _msDragStartTd = td;
  _msDragOccurred = false;
  _msDragMouseActive = false;
}

function _msOnMouseMove(e){
  if(!_msDragStartTd) return;

  if(_msActive && _msDragMouseActive){
    // Already dragging in select mode → add hovered cells
    const td = e.target.closest('td[data-empid]');
    if(td){
      const key = td.dataset.empid + '|' + td.dataset.date;
      if(!_msSelected.has(key)) _msToggleCell(td, td.dataset.empid, td.dataset.date);
    }
    return;
  }

  if(_msDragMouseActive) return; // already handled above

  // Check drag threshold
  const dx = Math.abs(e.clientX - _msDragStartX);
  const dy = Math.abs(e.clientY - _msDragStartY);
  if(dx < _MS_DRAG_THRESHOLD && dy < _MS_DRAG_THRESHOLD) return;

  // Threshold crossed → enter multi-select drag mode
  if(!isAdminOrMgr()) return;
  _msDragOccurred = true;
  _msDragMouseActive = true;
  _msActive = true;
  _msSelected.clear();
  const btn = document.getElementById('msToggleBtn');
  if(btn){ btn.style.background='rgba(167,139,250,.25)'; btn.style.borderColor='#a78bfa'; btn.textContent='✕ Cancel Select'; }
  // Select the origin cell first
  _msToggleCell(_msDragStartTd, _msDragStartTd.dataset.empid, _msDragStartTd.dataset.date);
  // Select current cell if different
  const cur = e.target.closest('td[data-empid]');
  if(cur && cur !== _msDragStartTd){
    const key = cur.dataset.empid + '|' + cur.dataset.date;
    if(!_msSelected.has(key)) _msToggleCell(cur, cur.dataset.empid, cur.dataset.date);
  }
  e.preventDefault();
}

function _msOnMouseUp(e){
  _msDragMouseActive = false;
  _msDragStartTd = null;
  if(_msActive && _msSelected.size === 0) _msActive = false;
}

// Suppress click if drag occurred (so shift picker doesn't open after drag)
function _msOnClick(e){
  if(_msDragOccurred){
    _msDragOccurred = false;
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}

// Also support desktop: Escape to cancel
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && _msActive) clearMultiSelect();
});


/** How many date columns to show — mobile 11, landscape mobile 14, desktop 21+ */
function _schedColWidth(){
  try{
    const w = window.innerWidth || 360;
    if(w <= 640) return 28;   // mobile: +2px for readable D/N cells
    if(w <= 900) return 30;
    return 34;                // desktop
  }catch(e){ return 28; }
}
function _schedEcolWidth(){
  try{
    const w = window.innerWidth || 360;
    if(w <= 640) return 86;   // mobile: wider name column
    if(w <= 900) return 110;
    return 128;
  }catch(e){ return 86; }
}
/** How many date columns.
 *  Mobile:  5 days back + today + 15 upcoming = 21
 *  Laptop:  5 days back + today + 30 upcoming = 36
 */
function _schedBackDays(){ return 5; }
function _schedAheadDays(){
  try{
    const w = window.innerWidth || 360;
    // phones / small tablets
    if(w <= 768) return 15;
    // laptop / desktop
    return 30;
  }catch(e){ return 15; }
}
function _schedDayCount(){
  try{
    // total columns = back + today + ahead
    return _schedBackDays() + 1 + _schedAheadDays();
  }catch(e){ return 21; }
}
function _schedDefaultOff(){
  // start window this many days before today
  return -_schedBackDays();
}

function moveW(n){
  const _d1=new Date(TODAY_STR+'T00:00:00'); _d1.setFullYear(_d1.getFullYear()-1);
  const _d2=new Date(TODAY_STR+'T00:00:00'); _d2.setFullYear(_d2.getFullYear()+1);
  const SCHED_MIN=_d1.toISOString().split('T')[0];
  const SCHED_MAX=_d2.toISOString().split('T')[0];
  const proposed = schedOff + n;
  const firstDay = addDays(TODAY_STR, proposed);
  const _span = (typeof _schedDayCount==='function' ? _schedDayCount() : 21) - 1;
  const lastDay  = addDays(TODAY_STR, proposed + _span);
  // Block if entire window is outside valid range
  if(lastDay < SCHED_MIN) return;
  if(firstDay > SCHED_MAX) return;
  // Clamp: if going back would go before Aug 2025, snap to Aug 1
  if(firstDay < SCHED_MIN){
    const minDate = new Date(SCHED_MIN+'T00:00:00');
    const todayDate = new Date(TODAY_STR+'T00:00:00');
    schedOff = Math.ceil((minDate - todayDate) / 86400000);
  } else {
    schedOff = proposed;
  }
  renderSchedule();
}
function setSchedSec(s,el){
  const code = String(s||'ALL');
  // Primary chips (All / Section / Machine / …) clear multi-select
  if(code==='ALL' || code.startsWith('CAT:')){
    schedSec = code;
    schedSubMulti = [];
  } else if(code.startsWith('SEC:') || code.startsWith('MC:') || code.startsWith('RESP:') || code.startsWith('DESIG:')){
    // Secondary chip → multi-select toggle
    const prefix = code.startsWith('SEC:') ? 'SEC:' : code.startsWith('MC:') ? 'MC:' : code.startsWith('RESP:') ? 'RESP:' : 'DESIG:';
    // Keep category context
    if(prefix==='SEC:') schedSec = 'CAT:section';
    else if(prefix==='MC:') schedSec = 'CAT:machine';
    else if(prefix==='RESP:') schedSec = 'CAT:responsibility';
    else schedSec = 'CAT:designation';
    // Drop selections from other categories
    schedSubMulti = (schedSubMulti||[]).filter(x=>String(x).startsWith(prefix));
    const idx = schedSubMulti.indexOf(code);
    if(idx >= 0) schedSubMulti.splice(idx, 1);
    else schedSubMulti.push(code);
  } else {
    schedSec = code;
    schedSubMulti = [];
  }
  _renderSchedFilterChips(schedSec);
  renderSchedule();
  setTimeout(syncStickyTop,80);
}
function renderScheduleLegend(emps, dates){
  const el=document.getElementById('schedLegend');
  if(!el) return;
  const cfg=getShiftConfigSync();
  let cfgShifts=(cfg.shifts&&cfg.shifts.length)?cfg.shifts.slice():[
    {code:'D',label:'Day Shift',active:true},{code:'N',label:'Night Shift',active:true},
    {code:'A',label:'A Shift',active:false},{code:'B',label:'B Shift',active:false},{code:'C',label:'C Shift',active:false}
  ];
  // Hide inactive shifts + Profile "hide D/N" / "hide A/B/C" from bottom legend too
  cfgShifts = cfgShifts.filter(s=>{
    if(!s || !s.code) return false;
    // Only ticked (active) shifts appear in legend / counts / picker
    if(s.active === false) return false;
    return true;
  });

  // Count status codes in current view (hide legend items with zero usage)
  const roster = emps || getSchedFilteredEmps().filter(e=>e.status!=='resigned');
  let dateList = dates;
  if(!dateList || !dateList.length){
    if(_customRangeActive && _customDateFrom && _customDateTo){
      dateList=[]; const d=new Date(_customDateFrom), e=new Date(_customDateTo); let cur=new Date(d);
      while(cur<=e){ dateList.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }
    } else {
      dateList=Array.from({length:_schedDayCount()},(_,i)=>addDays(TODAY_STR,schedOff+i));
    }
  }
  const used = new Set();
  roster.forEach(emp=>{
    dateList.forEach(d=>{
      let sh = getShift(emp, d);
      if(sh === 'CO') sh = 'C/O';
      if(sh) used.add(String(sh));
    });
  });

  let html='';
  cfgShifts.forEach(s=>{
    // Always show canonical code (A not "To"/"Te") using label when config code is corrupt
    const code = (typeof normalizeShiftCode==='function')
      ? normalizeShiftCode(s.code, s.label)
      : String(s.code||'').toUpperCase();
    const codeU = String(code||'').toUpperCase();
    if(used.size && !used.has(codeU) && !used.has(code) && !used.has(s.code) && !used.has(String(s.code||'').toUpperCase())){
      // still show active standard shifts even if unused in view (legend education)
      if(!['D','N','A','B','C'].includes(codeU)) return;
    }
    const time=(s.start&&s.end)?` ${s.start}–${s.end}`:'';
    const label = s.label || code;
    html+=`<div class="leg"><span class="shc ${cellClass(code)}" data-no-i18n="1">${cellDisp(code)}</span> ${label}${time}</div>`;
  });
  const _enLeg = (typeof _lang!=='undefined' && _lang!=='hi');
  const _Lleg = (hi,en)=> (typeof L==='function'?L(hi,en):(_enLeg?en:hi));
  const statusLegs = [
    {code:'O', label:_Lleg('छुट्टी','Weekly Off'), cls:'O'},
    {code:'L', label:_Lleg('लीव','Leave'), cls:'L'},
    {code:'C/O', label:'C-Off', cls:'CO', alt:['CO']},
    {code:'G', label:_Lleg('जनरल','General'), cls:'G'},
    {code:'HLF', label:_Lleg('आधा दिन','Half Day'), cls:'HLF'},
    {code:'Ab', label:_Lleg('अनुपस्थित','Absent'), cls:'Ab'},
    {code:'H', label:_Lleg('हॉलिडे','Holiday'), cls:'H'},
    {code:'OD', label:_Lleg('अन्य विभाग','Other Dept'), cls:'OD'},
  ];
  statusLegs.forEach(item=>{
    const hit = used.has(item.code) || (item.alt||[]).some(a=>used.has(a));
    if(!hit) return; // hide zero-count (e.g. OD when nobody has OD)
    const disp = item.code === 'C/O' ? 'CO' : (item.code === 'HLF' ? '½' : item.code);
    html+=`<div class="leg"><span class="shc ${item.cls}">${disp}</span>${item.label}</div>`;
  });
  el.innerHTML=html;
}


/** Align schedule date header columns with table shift cells (fixes mobile white-gap drift). */

/**
 * Build schedule table section groups from the active filter category.
 * ALL / CAT:section → group by Section
 * CAT:machine       → group by Machine
 * CAT:responsibility→ group by Responsibility
 * CAT:designation   → group by Designation
 * SEC:/MC:/RESP:/DESIG: value → single group for that value (after row filter)
 */

/** Weekly-off rank (SUN=0 … SAT=6); unknown last */
function _woffRank(emp){
  try{
    const w = String(emp && emp.woff || '').toUpperCase().slice(0,3);
    if(typeof WOFF_DOW !== 'undefined' && WOFF_DOW[w] !== undefined) return WOFF_DOW[w];
    const map = {SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};
    return map[w] !== undefined ? map[w] : 99;
  }catch(e){ return 99; }
}
function _sortByName(a,b){
  return String(a.name||'').localeCompare(String(b.name||''), undefined, {sensitivity:'base'});
}
/** All / Section view: Responsibility → Weekly off → Name */
function _sortSecRespWoffName(a,b){
  const ra = String((typeof getEmpResp==='function'?getEmpResp(a):'')||a.resp||a.responsibility||'').toLowerCase();
  const rb = String((typeof getEmpResp==='function'?getEmpResp(b):'')||b.resp||b.responsibility||'').toLowerCase();
  if(ra !== rb) return ra.localeCompare(rb);
  const wa = _woffRank(a), wb = _woffRank(b);
  if(wa !== wb) return wa - wb;
  return _sortByName(a,b);
}
/** Other filters: Weekly off first (earliest off above), then Name */
function _sortWoffThenName(a,b){
  const wa = _woffRank(a), wb = _woffRank(b);
  if(wa !== wb) return wa - wb;
  return _sortByName(a,b);
}

function _schedGroupMode(){
  const s = String(schedSec||'ALL');
  if(s==='ALL') return 'section';
  if(s==='CAT:section' || s.startsWith('SEC:')) return 'section';
  if(s==='CAT:machine' || s.startsWith('MC:')) return 'machine';
  if(s==='CAT:responsibility' || s.startsWith('RESP:')) return 'responsibility';
  if(s==='CAT:designation' || s.startsWith('DESIG:')) return 'designation';
  return 'section';
}

function _buildSchedDisplayGroups(allEmps){
  const mode = _schedGroupMode();
  const colors = ['#f97316','#38bdf8','#a855f7','#16a34a','#db2777','#0891b2','#eab308','#6366f1','#14b8a6','#f43f5e'];
  const icons = { section:'🏭', machine:'⚙️', responsibility:'🎯', designation:'💼' };
  const icon = icons[mode] || '📋';
  const isEn = (_lang !== 'hi');
  const modeLabel = {
    section: L('सेक्शन','SECTION'),
    machine: L('मशीन','MACHINE'),
    responsibility: L('ज़िम्मेदारी','RESPONSIBILITY'),
    designation: L('DESIGNATION','DESIGNATION')
  }[mode] || mode.toUpperCase();

  // Collect unique values (case-insensitive) present in the already-filtered roster
  const valMap = new Map();
  (allEmps||[]).forEach(e=>{
    const v = _empGroupKey(e, mode);
    if(!v) return;
    const k = _normLabelKey(v);
    valMap.set(k, _preferLabel(valMap.get(k), v));
  });
  let vals = Array.from(valMap.values()).sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'}));

  // Multi / single sub-filter: keep only selected values as group headers
  const s = String(schedSec||'');
  const multi = Array.isArray(schedSubMulti) ? schedSubMulti.filter(Boolean) : [];
  if(multi.length){
    const want = new Set();
    multi.forEach(code=>{
      const c=String(code);
      if(c.startsWith('SEC:')) want.add(_normLabelKey(c.slice(4)));
      else if(c.startsWith('MC:')) want.add(_normLabelKey(c.slice(3)));
      else if(c.startsWith('RESP:')) want.add(_normLabelKey(c.slice(5)));
      else if(c.startsWith('DESIG:')) want.add(_normLabelKey(c.slice(6)));
    });
    vals = vals.filter(v=> want.has(_normLabelKey(v)) || want.has(_normSecKey(v)));
  } else {
    if(s.startsWith('SEC:')){
      const nl=_normLabelKey(s.slice(4));
      vals = vals.filter(v=>_normLabelKey(v)===nl || _normSecKey(v)===_normSecKey(s.slice(4)));
    }
    if(s.startsWith('MC:')){
      const nl=_normLabelKey(s.slice(3));
      vals = vals.filter(v=>_normLabelKey(v)===nl || _normSecKey(v)===_normSecKey(s.slice(3)));
    }
    if(s.startsWith('RESP:')){
      const nl=_normLabelKey(s.slice(5));
      vals = vals.filter(v=>_normLabelKey(v)===nl);
    }
    if(s.startsWith('DESIG:')){
      const nl=_normLabelKey(s.slice(6));
      vals = vals.filter(v=>_normLabelKey(v)===nl);
    }
  }

  const groups = [];
  if(!vals.length){
    groups.push({
      key:'all',
      label: icon + ' ' + (L('टीम','TEAM')) + ' — ' + modeLabel,
      color:'#94a3b8',
      filter: e => true,
      sort: (mode==='section') ? _sortSecRespWoffName : _sortWoffThenName
    });
  } else {
    vals.forEach((val, i)=>{
      groups.push({
        key: mode + '_' + i,
        label: icon + ' ' + String(val).toUpperCase() + ' — ' + modeLabel,
        color: colors[i % colors.length],
        filter: e => {
          const k = _empGroupKey(e, mode);
          if(mode==='section' || mode==='machine'){
            return k===val || _normSecKey(k)===_normSecKey(val) || _normLabelKey(k)===_normLabelKey(val);
          }
          return _normLabelKey(k)===_normLabelKey(val);
        },
        sort: (mode==='section') ? _sortSecRespWoffName : _sortWoffThenName
      });
    });
  }

  // Orphans (empty field for this mode)
  const inAny = new Set();
  groups.forEach(g=>{
    (allEmps||[]).filter(g.filter).forEach(e=>inAny.add(e.id));
  });
  const orphans = (allEmps||[]).filter(e=>!inAny.has(e.id));
  if(orphans.length){
    groups.push({
      key:'dyn_none',
      label:'👤 '+(L('अवर्गीकृत / अन्य','Unassigned / Other')),
      color:'#64748b',
      filter: e => !inAny.has(e.id),
      sort: (mode==='section') ? _sortSecRespWoffName : _sortWoffThenName
    });
  }
  return groups;
}

function _alignSchedColumns(){
  try{
    const tbl = document.getElementById('schedTbl');
    const dateHdr = document.getElementById('schedDateHdr');
    // In-table sticky thead: only lock colgroup widths on the table
    const theadSticky = tbl && tbl.querySelector('thead.sched-thead-sticky');
    if(theadSticky){
      const mob = window.innerWidth <= 640;
      const colW = (typeof _schedColWidth==='function') ? _schedColWidth() : (mob ? 28 : 34);
      const ecolW = (typeof _schedEcolWidth==='function') ? _schedEcolWidth() : (mob ? 86 : 128);
      const n = theadSticky.querySelectorAll('tr.sched-date-row th.sched-date-th').length;
      if(n){
        let cg = tbl.querySelector('colgroup');
        if(!cg){ cg = document.createElement('colgroup'); tbl.insertBefore(cg, tbl.firstChild); }
        cg.innerHTML = '<col style="width:'+ecolW+'px">'+Array.from({length:n}).map(()=>'<col style="width:'+colW+'px">').join('');
        tbl.style.tableLayout = 'fixed';
        tbl.style.width = (ecolW + n*colW)+'px';
        tbl.style.minWidth = (ecolW + n*colW)+'px';
        theadSticky.querySelectorAll('th.sched-date-th').forEach(th=>{
          th.style.width = colW+'px';
          th.style.minWidth = colW+'px';
          th.style.maxWidth = colW+'px';
        });
        theadSticky.querySelectorAll('th.ecol').forEach(th=>{
          th.style.width = ecolW+'px';
          th.style.minWidth = ecolW+'px';
          th.style.maxWidth = ecolW+'px';
        });
        tbl.querySelectorAll('tbody tr:not(.sec-row)').forEach(tr=>{
          const cells = tr.children;
          for(let i=0;i<cells.length;i++){
            cells[i].style.boxSizing = 'border-box';
            if(i===0){ cells[i].style.width=ecolW+'px'; cells[i].style.minWidth=ecolW+'px'; cells[i].style.maxWidth=ecolW+'px'; }
            else { cells[i].style.width=colW+'px'; cells[i].style.minWidth=colW+'px'; cells[i].style.maxWidth=colW+'px'; }
          }
        });
      }
      return;
    }

    const monthHdr = document.getElementById('schedMonthHdr');
    const hdrStack = document.getElementById('schedHdrStack');
    const hdrWrap = document.getElementById('schedDateHdrWrap');
    const wrap = document.getElementById('schedWrap');
    if(!tbl || !dateHdr) return;

    const mob = window.innerWidth <= 640;
    const colW = (typeof _schedColWidth==='function') ? _schedColWidth() : (mob ? 28 : 34);
    const ecolW = (typeof _schedEcolWidth==='function') ? _schedEcolWidth() : (mob ? 86 : 128);

    // Count date columns from header (prefer data-date-col) or table
    let hdrCells = [...dateHdr.querySelectorAll('[data-date-col]')];
    // Ensure name spacer exists as first child
    let spacer = dateHdr.querySelector('.sched-ecol-spacer');
    if(!spacer){
      spacer = document.createElement('div');
      spacer.className = 'sched-ecol-spacer';
      dateHdr.insertBefore(spacer, dateHdr.firstChild);
    }
    // Re-query date cells only
    hdrCells = [...dateHdr.querySelectorAll('[data-date-col]')];
    const n = hdrCells.length || (tbl.querySelector('tbody tr:not(.sec-row)')?.cells?.length - 1) || 0;
    if(!n) return;

    const totalW = ecolW + n * colW;

    // Table fixed layout
    let cg = tbl.querySelector('colgroup');
    if(!cg){
      cg = document.createElement('colgroup');
      tbl.insertBefore(cg, tbl.firstChild);
    }
    cg.innerHTML = '<col class="sched-ecol" style="width:'+ecolW+'px;min-width:'+ecolW+'px">' +
      Array.from({length:n}).map(()=>'<col class="sched-dcol" style="width:'+colW+'px;min-width:'+colW+'px">').join('');

    tbl.style.tableLayout = 'fixed';
    tbl.style.borderCollapse = 'collapse';
    tbl.style.width = totalW + 'px';
    tbl.style.minWidth = totalW + 'px';
    tbl.style.maxWidth = totalW + 'px';

    // Force every body cell width
    tbl.querySelectorAll('tbody tr').forEach(tr=>{
      if(tr.classList.contains('sec-row')){
        // section banner rows: single cell spanning — leave alone
        return;
      }
      const tds = tr.children;
      for(let i=0;i<tds.length;i++){
        const td = tds[i];
        td.style.boxSizing = 'border-box';
        td.style.paddingLeft = '0';
        td.style.paddingRight = '0';
        if(i===0){
          td.style.width = ecolW+'px';
          td.style.minWidth = ecolW+'px';
          td.style.maxWidth = ecolW+'px';
        } else {
          td.style.width = colW+'px';
          td.style.minWidth = colW+'px';
          td.style.maxWidth = colW+'px';
        }
      }
    });

    // Name spacer in date header (matches employee column)
    spacer.style.flex = 'none';
    spacer.style.boxSizing = 'border-box';
    spacer.style.width = ecolW+'px';
    spacer.style.minWidth = ecolW+'px';
    spacer.style.maxWidth = ecolW+'px';
    spacer.style.margin = '0';
    spacer.style.padding = '0';
    spacer.style.flexShrink = '0';

    // Date header cells — exact same width as table day columns
    dateHdr.style.display = 'flex';
    dateHdr.style.boxSizing = 'border-box';
    dateHdr.style.padding = '0';
    dateHdr.style.margin = '0';
    dateHdr.style.width = totalW+'px';
    dateHdr.style.minWidth = totalW+'px';
    dateHdr.style.maxWidth = totalW+'px';

    hdrCells.forEach(hc=>{
      hc.style.flex = 'none';
      hc.style.flexShrink = '0';
      hc.style.boxSizing = 'border-box';
      hc.style.width = colW+'px';
      hc.style.minWidth = colW+'px';
      hc.style.maxWidth = colW+'px';
      hc.style.margin = '0';
      hc.style.paddingLeft = '0';
      hc.style.paddingRight = '0';
    });

    // Month header: spacer + month groups rebuilt to exact colW
    if(monthHdr){
      monthHdr.style.display = 'flex';
      monthHdr.style.boxSizing = 'border-box';
      monthHdr.style.padding = '0';
      monthHdr.style.margin = '0';
      monthHdr.style.width = totalW+'px';
      monthHdr.style.minWidth = totalW+'px';
      monthHdr.style.maxWidth = totalW+'px';
      // If month groups exist, scale them; else leave for renderSchedule builder
      const groups = [...monthHdr.querySelectorAll(':scope > div')];
      if(groups.length){
        // First child should be spacer
        let mSpacer = monthHdr.querySelector('.sched-ecol-spacer');
        if(!mSpacer){
          mSpacer = document.createElement('div');
          mSpacer.className = 'sched-ecol-spacer';
          monthHdr.insertBefore(mSpacer, monthHdr.firstChild);
        }
        mSpacer.style.flex = 'none';
        mSpacer.style.width = ecolW+'px';
        mSpacer.style.minWidth = ecolW+'px';
        mSpacer.style.maxWidth = ecolW+'px';
        mSpacer.style.margin = '0';
        mSpacer.style.padding = '0';
      }
    }

    if(hdrStack){
      hdrStack.style.display = 'flex';
      hdrStack.style.flexDirection = 'column';
      hdrStack.style.width = totalW+'px';
      hdrStack.style.minWidth = totalW+'px';
      hdrStack.style.maxWidth = totalW+'px';
      hdrStack.style.boxSizing = 'border-box';
    }
    if(hdrWrap){
      hdrWrap.style.margin = '0';
      hdrWrap.style.padding = '0';
      hdrWrap.style.overflowX = 'auto';
      hdrWrap.style.overflowY = 'hidden';
    }
    if(wrap){
      wrap.style.margin = '0';
      wrap.style.padding = '0';
      wrap.style.overflowX = 'auto';
    }

    // Keep scroll positions in sync
    if(wrap && hdrWrap && Math.abs(wrap.scrollLeft - hdrWrap.scrollLeft) > 1){
      hdrWrap.scrollLeft = wrap.scrollLeft;
    }
  }catch(e){ console.warn('[_alignSchedColumns]', e); }
}


function renderSchedule(){
  try{
    if(!window._schedJoinSanitized && typeof sanitizeSchedulesBeforeJoining==='function'){
      window._schedJoinSanitized = true;
      sanitizeSchedulesBeforeJoining({persist:false});
    }
  }catch(e){}

  // Force compact mobile layout every render (CSS alone was not enough on some phones)
  try{
    if(window.innerWidth <= 640){
      let s = document.getElementById('mpMobileSchedLock');
      if(!s){ s=document.createElement('style'); s.id='mpMobileSchedLock'; document.head.appendChild(s); }
      s.textContent = `
        .sched-tbl { min-width:0 !important; table-layout:fixed !important; width:max-content !important; }
        .sched-tbl col.sched-ecol { width:72px; min-width:72px; max-width:72px; }
        .sched-tbl col.sched-dcol { width:28px; min-width:28px; max-width:28px; }
        .sched-tbl td { padding:2px 0 !important; box-sizing:border-box !important; }
        .sched-tbl td.ecol, .sched-tbl th.ecol {
          min-width:86px !important; max-width:96px !important; width:86px !important;
          padding:4px 4px !important; box-sizing:border-box !important;
        }
        .sched-tbl td:not(.ecol), .sched-tbl th:not(.ecol) {
          width:28px !important; min-width:28px !important; max-width:28px !important;
          padding:2px 0 !important; box-sizing:border-box !important;
        }
        .sched-tbl .shc, .sched-tbl span.shc, .sched-tbl .shc.shc-sm {
          width:22px !important; height:20px !important; min-width:22px !important;
          font-size:10px !important; border-radius:4px !important;
          margin:0 auto !important; display:inline-flex !important;
          align-items:center !important; justify-content:center !important;
        }
        #schedDateHdr, #schedMonthHdr { box-sizing:border-box !important; }
        #schedDateHdr > div {
          flex:none !important;
          width:28px !important; min-width:28px !important; max-width:28px !important;
          padding:3px 0 !important; margin:0 !important;
          box-sizing:border-box !important; overflow:hidden !important;
        }
        /* Today: same width — only inset highlight (no grow) */
        #schedDateHdr > div[data-today-col="1"] {
          width:28px !important; min-width:28px !important; max-width:28px !important;
          background:rgba(249,115,22,.35) !important;
          border:none !important;
          box-shadow:inset 0 0 0 2px #f97316 !important;
          border-radius:4px !important;
        }
        .sched-tbl td.sched-today-col {
          background:rgba(249,115,22,.18) !important;
          box-shadow:inset 0 0 0 1.5px rgba(249,115,22,.75) !important;
        }
      `;
    }
  }catch(e){}
  _renderSchedFilterChips(schedSec);
  // legend filled after allEmps/dates ready
  const _d1=new Date(TODAY_STR+'T00:00:00'); _d1.setFullYear(_d1.getFullYear()-1);
  const _d2=new Date(TODAY_STR+'T00:00:00'); _d2.setFullYear(_d2.getFullYear()+1);
  const SCHED_MIN=_d1.toISOString().split('T')[0];
  const SCHED_MAX=_d2.toISOString().split('T')[0];
  let dates;
  if(_customRangeActive && _customDateFrom && _customDateTo){
    // Build date array from custom range
    const d=new Date(_customDateFrom), e=new Date(_customDateTo);
    dates=[]; let cur=new Date(d);
    while(cur<=e){ dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }
  } else {
    dates=Array.from({length:_schedDayCount()},(_,i)=>addDays(TODAY_STR,schedOff+i));
  }
  // Disable/enable nav buttons at boundaries
  const prevBtn = document.querySelector('.nav-btn[onclick="moveW(-7)"]');
  const nextBtn = document.querySelector('.nav-btn[onclick="moveW(7)"]');
  if(prevBtn) prevBtn.style.opacity = (dates[0] <= SCHED_MIN) ? '0.3' : '1';
  if(prevBtn) prevBtn.disabled = (dates[0] <= SCHED_MIN);
  if(nextBtn) nextBtn.style.opacity = (dates[dates.length-1] >= SCHED_MAX) ? '0.3' : '1';
  if(nextBtn) nextBtn.disabled = (dates[dates.length-1] >= SCHED_MAX);
  document.getElementById('schedLbl').textContent=`${fmtShort(dates[0])} – ${fmtShort(dates[dates.length-1])}`;

  const allEmps = (
    getSchedFilteredEmps()
  ).filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length > 0);

  // ── Build ordered display groups from active category (Section / Machine / Resp / Desig) ──
  try{ renderScheduleLegend(allEmps, dates); }catch(e){}
  try{ _lastSchedDayCount = dates.length; }catch(e){}
  const DISPLAY_ORDER = _buildSchedDisplayGroups(allEmps);

  // Build date cells for BOTH sticky header and table thead
  // Fade columns after today with no roster data
  const _emptyFutureCols = new Set();
  try{
    dates.forEach((d, di)=>{
      if(d <= TODAY_STR) return;
      let any = false;
      for(const emp of allEmps){
        const sh = getShift(emp, d);
        if(sh && String(sh).trim()){ any = true; break; }
      }
      if(!any) _emptyFutureCols.add(di);
    });
  }catch(e){}
  const dateCellsHtml = dates.map(d=>{
    const dO=new Date(d);const isT=d===TODAY_STR;
    const bg=isT?'rgba(249,115,22,.18)':'var(--card2)';
    const col=isT?'#ffffff':'#f8fafc';
    const colSub=isT?'#ffedd5':'#cbd5e1';
    return {isT, bg, col, colSub, day:DAYS_EN[dO.getDay()], date:dO.getDate(), month:dO.getMonth(), year:dO.getFullYear()};
  });

  // Hide external dual-header (was causing misalignment). Dates live in table thead.
  try{
    const _ext = document.getElementById('schedDateHdrWrap');
    if(_ext) _ext.style.display = 'none';
    const _stk = document.getElementById('schedHdrStack');
    if(_stk) _stk.style.display = 'none';
  }catch(e){}

  // In-table sticky thead — same columns as body (perfect alignment)
  const _mobH = (typeof window!=='undefined' && window.innerWidth<=640);
  const _colWH = (typeof _schedColWidth==='function') ? _schedColWidth() : (_mobH ? 28 : 34);
  const _ecolH = (typeof _schedEcolWidth==='function') ? _schedEcolWidth() : (_mobH ? 86 : 128);

  // Month groups for first header row
  const _monthGroups = [];
  dateCellsHtml.forEach((c,i)=>{
    const key = c.year+'-'+c.month;
    if(!_monthGroups.length || _monthGroups[_monthGroups.length-1].key!==key){
      _monthGroups.push({key, month:c.month, year:c.year, span:0});
    }
    _monthGroups[_monthGroups.length-1].span++;
  });
  const MONTHS_SHORT_H = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const MONTH_COLORS_H = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#a855f7','#eab308'];
  const monthThs = _monthGroups.map(g=>{
    const color = MONTH_COLORS_H[g.month % 12];
    const label = MONTHS_SHORT_H[g.month]+' '+String(g.year).slice(2);
    return `<th class="sched-month-th" colspan="${g.span}" style="background:#0a1628;color:${color};font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;letter-spacing:.5px;text-align:center;padding:4px 2px;border-right:1px solid rgba(255,255,255,.1)">${label}</th>`;
  }).join('');

  const dateThs = dateCellsHtml.map((c,i)=>{
    const emptyCls = _emptyFutureCols.has(i) ? ' sched-empty-col' : '';
    const todayCls = c.isT ? ' sched-today-col' : '';
    const bg = c.isT ? 'rgba(249,115,22,.32)' : '#1c2d42';
    const shadow = c.isT ? 'box-shadow:inset 0 0 0 2px #f97316;' : '';
    return `<th class="sched-date-th${todayCls}${emptyCls}" data-date-col="${i}" style="width:${_colWH}px;min-width:${_colWH}px;max-width:${_colWH}px;box-sizing:border-box;text-align:center;padding:4px 0;background:${bg};${shadow}border-right:1px solid rgba(255,255,255,.08)">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:800;color:${c.colSub};line-height:1.1">${c.day}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${c.col};line-height:1.15">${c.date}</div>
    </th>`;
  }).join('');

  let thead = `<thead class="sched-thead-sticky">
    <tr class="sched-month-row">
      <th class="ecol sched-month-th" style="width:${_ecolH}px;min-width:${_ecolH}px;max-width:${_ecolH}px;background:#0a1628"></th>
      ${monthThs}
    </tr>
    <tr class="sched-date-row">
      <th class="ecol" style="width:${_ecolH}px;min-width:${_ecolH}px;max-width:${_ecolH}px;background:#1e293b;box-shadow:3px 0 8px rgba(0,0,0,.5)"></th>
      ${dateThs}
    </tr>
  </thead>`;

  let tbody='<tbody>';
  DISPLAY_ORDER.forEach(group=>{
    const members = allEmps.filter(group.filter).sort(group.sort);
    if(!members.length) return;
    tbody+=`<tr class="sec-row"><td colspan="${dates.length+1}"><span class="sec-row-lbl" style="color:${group.color}">${group.label}</span></td></tr>`;
    members.forEach(emp=>{
      const isMe=emp.id===SESSION.empObjId;
      const role=getEmpRole(emp);
      const isMain=role.role==='main';
      tbody+=`<tr class="${isMe?'my-row':''}${isMain?' main-op-row':''}">
        <td class="ecol" title="${String(emp.name||'').replace(/"/g,'&quot;')} · ${emp.empId||''}"
          onclick="event.stopPropagation();showEmpNameFull('${String(emp.name||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}','${String(emp.empId||'').replace(/'/g,"\\'")}','${String(emp.sec||emp.mc||'').replace(/'/g,"\\'")}')">
          <div class="emp-nm" style="${isMain?'font-weight:900;':''}" title="${String(emp.name||'').replace(/"/g,'&quot;')}">
            ${isMain?'⭐ ':''}${emp.name}${isMe?' <span class="you-tag">आप</span>':''}
          </div>
          <div class="emp-id">${emp.empId||''}</div>
        </td>
        ${dates.map(d=>{
          const pendingKey = emp.id+'__'+d;
          const pending = _pendingShiftChanges[pendingKey];
          const sh = pending ? pending.newShift : getShift(emp,d);
          const origSh = getShift(emp,d);
          const isT=d===TODAY_STR;
          const isRealloc=!!(getOverrides()[emp.id+'_'+d]&&getOverrides()[emp.id+'_'+d]!=='L');
          const _mob = (typeof window!=='undefined' && window.innerWidth<=640);
          const _bw = _mob ? 22 : 28, _bh = _mob ? 20 : 24, _bfs = _mob ? 11 : 12;
          const _todayCls = (isT ? 'sched-today-col' : '') + (_emptyFutureCols.has(dates.indexOf(d)) ? ' sched-empty-col' : '');
          const _todayBg = isT ? 'background:rgba(249,115,22,.16);box-shadow:inset 0 0 0 1.5px rgba(249,115,22,.7);' : '';
          const clickable = canEditSchedule()
            ? `class="${_todayCls}" data-empid="${emp.id}" data-empname="${emp.name}" data-date="${d}" data-origsh="${origSh}" style="cursor:pointer;${_todayBg}" onclick="handleSchedCellClick(this,'${emp.id}','${emp.name}','${d}','${origSh}')"`
            : (['L','CO','C/O','OD','Ab','HLF'].includes(sh)
              ? `class="${_todayCls}" style="cursor:pointer;${_todayBg}" onclick="showShiftInfo('${emp.id}','${emp.name.replace(/'/g,"\'")}','${d}','${sh}')"`
              : `class="${_todayCls}" style="${_todayBg}"`);
          if(pending){
            return `<td ${clickable} data-cellkey="${emp.id}_${d}" data-pending="${pendingKey}" data-orig-shift="${origSh}">
              ${mpShiftBadgeHtml(sh,{w:_bw,h:_bh,fs:_bfs,extraStyle:'outline:2px solid var(--m1);border-radius:4px;box-shadow:0 0 6px rgba(249,115,22,.5)'})}
              ${canEditSchedule()?`<div style="font-size:7px;color:var(--m1);text-align:center;line-height:1;margin-top:1px;font-weight:900">NEW</div>`:''}
            </td>`;
          }
          return `<td ${clickable} data-cellkey="${emp.id}_${d}">
            ${mpShiftBadgeHtml(sh,{w:_bw,h:_bh,fs:_bfs,extraStyle:isRealloc?'outline:2px solid rgba(163,230,53,.5);border-radius:4px;':''})}
          </td>`;
                }).join('')}
      </tr>`;
    });
  });

  // ── Summary rows: one per configured shift + Leave count per date ──
  // Threshold warnings: M-1&2 → min 5, S-1&2 → min 3, Supervisor → min 2, ALL → no threshold
  const _thresh = getMinStaffForFilter();
  const summaryStyles = 'font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:13px;text-align:center;padding:4px 2px;';
  const _cfgFull = getShiftConfigSync();
  let _cfgShiftsForSummary = _discoverAllShiftCodes(allEmps, _cfgFull.shifts||[{code:'D',label:'Day'},{code:'N',label:'Night'}]);
  // Only active (ticked) shifts in summary count rows
  _cfgShiftsForSummary = _cfgShiftsForSummary.filter(s=>{
    const code = String((s && s.code)!=null ? s.code : s).toUpperCase();
    const full = (_cfgFull.shifts||[]).find(x=>String(x.code||'').toUpperCase()===code);
    return !full || full.active !== false;
  });
  const _shiftRowColorMap={
    D:{clr:'#f59e0b',bg:'rgba(245,158,11,.06)',icon:'☀️'},
    N:{clr:'#4f46e5',bg:'rgba(79,70,229,.06)',icon:'🌙'},
    A:{clr:'#16a34a',bg:'rgba(22,163,74,.08)',icon:'🅰️'},
    B:{clr:'#db2777',bg:'rgba(219,39,119,.08)',icon:'🅱️'},
    C:{clr:'#0891b2',bg:'rgba(8,145,178,.08)',icon:'©️'},
  };
  const _shiftRowColors=[
    {clr:'#f59e0b',bg:'rgba(245,158,11,.06)',icon:'☀️'},
    {clr:'#4f46e5',bg:'rgba(79,70,229,.06)',icon:'🌙'},
    {clr:'#16a34a',bg:'rgba(22,163,74,.08)',icon:'🅰️'},
    {clr:'#db2777',bg:'rgba(219,39,119,.08)',icon:'🅱️'},
    {clr:'#0891b2',bg:'rgba(8,145,178,.08)',icon:'©️'},
  ];
  let _workRowIdx = 0;
  _cfgShiftsForSummary.forEach((s,i)=>{
    const dayCounts = dates.map(d => allEmps.filter(e=>shiftCountsToward(getShift(e,d), s.code)).length);
    if(!dayCounts.some(n => n > 0)) return; // hide zero rows
    const colorSet=_shiftRowColorMap[String(s.code||"").toUpperCase()]||_shiftRowColors[i%_shiftRowColors.length];
    tbody += `<tr${_workRowIdx===0?' style="border-top:2px solid var(--border2)"':''}>
      <td class="ecol" style="font-size:10px;font-weight:800;color:${colorSet.clr};padding:4px 6px;white-space:nowrap">${colorSet.icon} ${s.label||s.code}</td>
      ${dayCounts.map(cnt => {
        const warn = _thresh > 0 && cnt < _thresh;
        const bg = warn ? 'rgba(244,63,94,.18)' : colorSet.bg;
        const clr = warn ? '#f43f5e' : colorSet.clr;
        const extra = warn ? 'outline:2px solid rgba(244,63,94,.5);border-radius:3px;' : '';
        return `<td style="${summaryStyles}color:${clr};background:${bg};${extra}">${cnt||'—'}${warn?'⚠️':''}</td>`;
      }).join('')}
    </tr>`;
    _workRowIdx++;
  });
  // Status / special codes (Leave, Off, C-Off, H, Ab, GP, OD, …) — hide row if all days are 0
  const _statusDefs = (typeof _scheduleStatusLegendDefs==='function') ? _scheduleStatusLegendDefs() : [];
  // Avoid duplicating work-shift codes already listed above (D/N/A/B/C/G if active)
  const _workCodesShown = new Set(_cfgShiftsForSummary.map(s=>String(s.code||'').toUpperCase()));
  _statusDefs.forEach(def=>{
    const code = def.code;
    if(_workCodesShown.has(String(code).toUpperCase()) && code!=='G') return; // G may appear in both — allow status row only if not in work list
    if(_workCodesShown.has(String(code).toUpperCase())) return;
    const dayCounts = dates.map(d => allEmps.filter(e => _shiftCodeMatches(getShift(e,d), code)).length);
    const any = dayCounts.some(n => n > 0);
    if(!any) return; // zero entire row → hide
    tbody += `<tr>
      <td class="ecol" style="font-size:10px;font-weight:800;color:${def.clr};padding:4px 6px;white-space:nowrap">${def.icon||''} ${def.label}</td>
      ${dayCounts.map(cnt => `<td style="${summaryStyles}color:${def.clr};background:${def.bg}">${cnt||'—'}</td>`).join('')}
    </tr>`;
  });

  // Total = sum of all shift/status counts that day (not just roster size)
  const _allSummaryCodes = [
    ..._cfgShiftsForSummary.map(s=>s.code),
    ..._statusDefs.map(d=>d.code).filter(c => !_workCodesShown.has(String(c).toUpperCase()))
  ];
  tbody += `<tr style="border-top:1.5px solid var(--border2)">
    <td class="ecol" style="font-size:10px;font-weight:900;color:#22c55e;padding:5px 6px;white-space:nowrap;background:rgba(34,197,94,.08)">👥 Total</td>
    ${dates.map(d => {
      // One pass over employees per day (was: codes × employees × getShift)
      let sum = 0;
      allEmps.forEach(e=>{
        const sh = getShift(e,d);
        if(sh && String(sh).trim()) sum++;
      });
      return `<td style="${summaryStyles}color:#22c55e;background:rgba(34,197,94,.08);font-size:14px">${sum||'—'}</td>`;
    }).join('')}
  </tr>`;

  tbody+='</tbody>';
  document.getElementById('schedTbl').innerHTML=thead+tbody;
  try{ if(typeof _lang!=='undefined'&&_lang!=='hi'&&typeof _translateDOM==='function') setTimeout(_translateDOM, 50); }catch(e){}
  // Re-render save bar (pending changes may span visible dates)
  _updateSaveBar();
  // Sync horizontal scroll: sticky date header <-> table scroll container
  setTimeout(()=>{
    const wrap = document.getElementById('schedWrap');
    const hdrWrap = document.getElementById('schedDateHdrWrap');
    const tbl = document.getElementById('schedTbl');
    const dateHdr = document.getElementById('schedDateHdr');

    // ── PIXEL-PERFECT ALIGNMENT ──
    // Read actual rendered column widths from the table body cells (first data row)
    // Force equal column widths (header + table) then build month row
    if(tbl && dateHdr){
      _alignSchedColumns();
      {
        const mob = window.innerWidth <= 640;
        const colW = (typeof _schedColWidth==='function') ? _schedColWidth() : (mob ? 26 : 34);
        const firstDataRow = tbl.querySelector('tbody tr:not(.sec-row)');
        const ecolWidth = (firstDataRow && firstDataRow.cells[0])
          ? firstDataRow.cells[0].getBoundingClientRect().width
          : ((typeof _schedEcolWidth==='function') ? _schedEcolWidth() : (mob ? 70 : 128));
        const hdrCells = dateHdr.querySelectorAll('[data-date-col]');
        const totalDateW = hdrCells.length * colW;

        // ── BUILD MONTH ROW ──
        const monthHdr = document.getElementById('schedMonthHdr');
        const hdrStack = document.getElementById('schedHdrStack');
        if(monthHdr){
          // Group consecutive dates by month/year using FIXED col widths
          const groups = [];
          dateCellsHtml.forEach((c, i)=>{
            const key = c.year + '-' + c.month;
            if(!groups.length || groups[groups.length-1].key !== key){
              groups.push({key, month:c.month, year:c.year, w:0, count:0});
            }
            groups[groups.length-1].w += colW;
            groups[groups.length-1].count++;
          });
          // Render month spans
          const MONTH_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#6366f1','#14b8a6','#ec4899','#84cc16','#0ea5e9'];
          monthHdr.style.paddingLeft = '0';
          monthHdr.style.minWidth = (ecolWidth + totalDateW) + 'px';
          const _ecolSp = (typeof _schedEcolWidth==='function')?_schedEcolWidth():128;
          monthHdr.innerHTML = `<div class="sched-ecol-spacer" style="flex:none;width:${_ecolSp}px;min-width:${_ecolSp}px;max-width:${_ecolSp}px;margin:0;padding:0"></div>` + groups.map(g=>{
            const color = MONTH_COLORS[g.month % 12];
            const label = MONTHS_SHORT[g.month] + ' ' + String(g.year).slice(2);
            return `<div style="flex:none;width:${g.w}px;min-width:${g.w}px;max-width:${g.w}px;text-align:center;padding:3px 0;box-sizing:border-box;border-right:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);overflow:hidden">
              <span style="font-family:'Barlow Condensed';font-size:10px;font-weight:900;color:${color};letter-spacing:.5px;text-transform:uppercase;white-space:nowrap">${label}</span>
            </div>`;
          }).join('');
          if(hdrStack){ hdrStack.style.minWidth = (_ecolSp + totalDateW) + 'px'; hdrStack.style.width = (_ecolSp + totalDateW) + 'px'; }
        }
      }
    }

    if(wrap && hdrWrap){
      // Remove old listeners first
      if(wrap._scrollSyncHandler){
        wrap.removeEventListener('scroll', wrap._scrollSyncHandler);
      }
      if(hdrWrap._scrollSyncHandler){
        hdrWrap.removeEventListener('scroll', hdrWrap._scrollSyncHandler);
      }
      let _syncing=false;
      wrap._scrollSyncHandler = ()=>{
        if(_syncing) return; _syncing=true;
        hdrWrap.scrollLeft = wrap.scrollLeft;
        _syncing=false;
      };
      hdrWrap._scrollSyncHandler = ()=>{
        if(_syncing) return; _syncing=true;
        wrap.scrollLeft = hdrWrap.scrollLeft;
        _syncing=false;
      };
      wrap.addEventListener('scroll', wrap._scrollSyncHandler);
      hdrWrap.addEventListener('scroll', hdrWrap._scrollSyncHandler);
      // Scroll to today column using fixed column width
      const todayIdx = dates.indexOf(TODAY_STR);
      if(todayIdx > 0){
        const colW = window.innerWidth <= 640 ? 22 : 32;
        const ecolW = window.innerWidth <= 640 ? 72 : 110;
        wrap.scrollLeft = Math.max(0, (todayIdx * colW) - colW * 2);
        const hdrWrap2 = document.getElementById('schedDateHdrWrap');
        if(hdrWrap2) hdrWrap2.scrollLeft = wrap.scrollLeft;
      }
    }
    _alignSchedColumns();
    syncStickyTop();
    try{ _bindSchedAdminScrollCollapse(); }catch(e){}
    // Second pass after fonts/layout settle
    requestAnimationFrame(()=>{ try{ _alignSchedColumns(); syncStickyTop(); }catch(e){} });
  }, 80);
  // Render shift trends below the table
  renderShiftTrends(allEmps, dates);
  // Attach multi-select touch events + reset any stale selection
  clearMultiSelect();
  setTimeout(_msAttachEvents, 100);
}

// ════════════════════════════════════════
// SHIFT TRENDS
// ════════════════════════════════════════
let _trendSortCol = 'name';
let _trendSortDir = 'asc'; // 'asc' or 'desc'
let _trendBarMetric = 'L'; // default bar chart metric

let _trendSectionOpen = false;
let _barSectionOpen = false;
function toggleTrendSection(which){
  if(which==='trends') _trendSectionOpen = !_trendSectionOpen;
  if(which==='bar') _barSectionOpen = !_barSectionOpen;
  // Re-render with same data
  let dates;
  if(_customRangeActive && _customDateFrom && _customDateTo){
    const d=new Date(_customDateFrom), e=new Date(_customDateTo);
    dates=[]; let cur=new Date(d);
    while(cur<=e){ dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }
  } else {
    dates=Array.from({length:_schedDayCount()},(_,i)=>addDays(TODAY_STR,schedOff+i));
  }
  const allEmps = getSchedFilteredEmps().filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length > 0);
  renderShiftTrends(allEmps, dates);
}

function renderShiftTrends(emps, dates){
  const el = document.getElementById('shiftTrendsSection');
  if(!el) return;
  if(!emps || emps.length === 0){ el.innerHTML=''; return; }

  const cfg = getShiftConfigSync();
  // Count shifts for each employee across the given dates
  let cfgShifts = _discoverAllShiftCodes(emps, cfg.shifts||[{code:'D'},{code:'N'}]);
  // Respect profile hide D/N and hide A/B/C
  cfgShifts = cfgShifts.filter(s=>{
    if(!s || !s.code) return false;
    // Only ticked (active) shifts appear in legend / counts / picker
    if(s.active === false) return false;
    return true;
  });
  const shiftColClasses = ['td-d','td-n','td-g'];
  const SHIFT_COLS = cfgShifts.map((s,i)=>({ key:s.code, label:s.code, cls:shiftColClasses[i%3] }));
  const STATUS_COLS = [
    { key:'O',   label:'O',   cls:'td-o'  },
    { key:'L',   label:'L',   cls:'td-l'  },
    { key:'C/O', label:'C/O', cls:'td-co' },
    { key:'G',   label:'G',   cls:'td-g'  },
    { key:'GP',  label:'GP',  cls:'td-gp' },
    { key:'HLF', label:'½',   cls:'td-hlf'},
    { key:'Ab',  label:'Ab',  cls:'td-ab' },
    { key:'H',   label:'H',   cls:'td-h'  },
    { key:'OD',  label:'OD',  cls:'td-od' },
  ];
  // Pre-count totals so we can hide zero-count status columns (e.g. OD)
  const totals = {};
  [...SHIFT_COLS, ...STATUS_COLS].forEach(c => totals[c.key] = 0);
  emps.forEach(e=>{
    dates.forEach(d=>{
      let sh = getShift(e, d);
      if(sh === 'CO') sh = 'C/O';
      if(sh && totals[sh] !== undefined) totals[sh]++;
    });
  });
  const COLS = [
    ...SHIFT_COLS.filter(c => (totals[c.key]||0) > 0 || SHIFT_COLS.length <= 3),
    ...STATUS_COLS.filter(c => (totals[c.key]||0) > 0),
  ];
  // Always keep at least name + one col if everything filtered
  if(!COLS.length && SHIFT_COLS.length) COLS.push(...SHIFT_COLS.slice(0,2));

  // Build data rows
  let rows = emps.map(e => {
    const counts = {};
    COLS.forEach(c => counts[c.key] = 0);
    dates.forEach(d => {
      const sh = getShift(e, d);
      const norm = sh === 'CO' ? 'C/O' : sh;
      if(counts[norm] !== undefined) counts[norm]++;
    });
    return { emp: e, counts };
  });

  // Sort
  if(_trendSortCol === 'name'){
    rows.sort((a,b) => _trendSortDir === 'asc'
      ? a.emp.name.localeCompare(b.emp.name)
      : b.emp.name.localeCompare(a.emp.name));
  } else {
    rows.sort((a,b) => _trendSortDir === 'asc'
      ? (a.counts[_trendSortCol]||0) - (b.counts[_trendSortCol]||0)
      : (b.counts[_trendSortCol]||0) - (a.counts[_trendSortCol]||0));
  }

  // Build header
  const thName = `<th onclick="sortTrends('name')" class="${_trendSortCol==='name'?'sort-active':''} ${_trendSortCol==='name'?(_trendSortDir==='asc'?'sort-asc':'sort-desc'):''}">नाम</th>`;
  const thCols = COLS.map(c =>
    `<th onclick="sortTrends('${c.key}')" class="${_trendSortCol===c.key?'sort-active':''} ${_trendSortCol===c.key?(_trendSortDir==='asc'?'sort-asc':'sort-desc'):''}">${c.label}</th>`
  ).join('');

  // Build rows
  const tbodyRows = rows.map(r => {
    const nameTd = `<td title="${r.emp.name}">${r.emp.name.split(' ')[0]}</td>`;
    const dataTds = COLS.map(c => {
      const v = r.counts[c.key];
      return `<td class="${v > 0 ? c.cls : 'td-zero'}">${v > 0 ? v : '—'}</td>`;
    }).join('');
    return `<tr>${nameTd}${dataTds}</tr>`;
  }).join('');

  const rangeLabel = dates.length > 0
    ? `${fmtShort(dates[0])} – ${fmtShort(dates[dates.length-1])} (${dates.length} ${(typeof L==='function'?L('दिन','days'):'days')})`
    : '';

  // ── BAR CHART: build bar data for current metric ──
  let BAR_METRICS = [
    {key:'L',   label:'Leave',  color:'#f43f5e'},
    {key:'Ab',  label:'Absent', color:'#ef4444'},
    {key:'HLF', label:'½ Day',  color:'#f59e0b'},
    {key:'O',   label:'Off',    color:'#a78bfa'},
    {key:'D',   label:'Day',    color:'#f97316'},
    {key:'N',   label:'Night',  color:'#818cf8'},
    {key:'A',   label:'A',      color:'#16a34a'},
    {key:'B',   label:'B',      color:'#db2777'},
    {key:'C',   label:'C',      color:'#0891b2'},
    {key:'OD',  label:'OD',     color:'#0d9488'},
  ];
  BAR_METRICS = BAR_METRICS.filter(m=>{
    const code = m.key;
    if(['D','N','A','B','C'].includes(code)){
      const sh = (cfg.shifts||[]).find(s=>String(s.code||'').toUpperCase()===code);
      if(sh && sh.active===false) return false;
    }
    if((totals[code]||0) === 0) return false;
    return true;
  });
  if(!BAR_METRICS.length){
    BAR_METRICS = [{key:'L', label:'Leave', color:'#f43f5e'}];
  }
  const bm = BAR_METRICS.find(m=>m.key===_trendBarMetric) || BAR_METRICS[0];
  if(bm) _trendBarMetric = bm.key;
  // Sort bars high→low
  const barData = [...rows].sort((a,b)=>(b.counts[bm.key]||0)-(a.counts[bm.key]||0));
  const barMax = Math.max(1, ...barData.map(r=>r.counts[bm.key]||0));
  const barHtml = barData.map(r=>{
    const v = r.counts[bm.key]||0;
    const pct = Math.round((v/barMax)*100);
    const name = r.emp.name.split(' ')[0];
    return `<div data-val="${v}" style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:72px;font-size:11px;font-weight:700;color:var(--text);text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.emp.name}">${name}</div>
      <div style="flex:1;background:var(--card2);border-radius:4px;height:18px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${bm.color};border-radius:4px;transition:width .3s ease;min-width:${v>0?'18px':'0'}"></div>
      </div>
      <div style="width:22px;font-size:11px;font-weight:800;color:${v>0?bm.color:'var(--muted)'};text-align:left;flex-shrink:0">${v>0?v:'—'}</div>
    </div>`;
  }).join('');

  const metricBtns = BAR_METRICS.map(m=>{
    const active = m.key===_trendBarMetric;
    return `<button onclick="setTrendBar('${m.key}')" style="padding:4px 10px;border-radius:6px;border:1px solid ${active?m.color:'var(--border2)'};background:${active?m.color+'22':'var(--card)'};color:${active?m.color:'var(--muted2)'};font-size:11px;font-weight:${active?'800':'600'};cursor:pointer;transition:all .2s">${m.label}</button>`;
  }).join('');

  const chevT = _trendSectionOpen ? '▼' : '▶';
  const chevB = _barSectionOpen ? '▼' : '▶';
  el.innerHTML = `
    <!-- SHIFT TRENDS (collapsed by default) -->
    <div style="margin-top:10px;background:var(--card);border:1px solid var(--border2);border-radius:12px;overflow:hidden">
      <button type="button" onclick="toggleTrendSection('trends')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:none;background:transparent;cursor:pointer;font-family:inherit;text-align:left">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:var(--muted2)">${chevT}</span>
          <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text)">📊 Shift Trends</span>
        </div>
        <span style="font-size:10px;color:var(--muted2);font-weight:600">${rangeLabel}</span>
      </button>
      <div id="trendTableBody" style="display:${_trendSectionOpen?'block':'none'};padding:0 10px 12px">
        <div class="trends-wrap">
          <table class="trends-tbl">
            <thead><tr>${thName}${thCols}</tr></thead>
            <tbody>${tbodyRows}</tbody>
          </table>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:6px;text-align:center">
          ${(typeof L==='function')?L('किसी भी column header पर tap करें — Low→High या High→Low sort होगा','Tap any column header to sort Low→High or High→Low'):'Tap any column header to sort Low→High or High→Low'}
        </div>
      </div>
    </div>
    <!-- EMPLOYEE BAR CHART (collapsed by default) -->
    <div id="trendBarChartBox" style="margin-top:10px;background:var(--card);border:1px solid var(--border2);border-radius:12px;overflow:hidden">
      <button type="button" onclick="toggleTrendSection('bar')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:none;background:transparent;cursor:pointer;font-family:inherit;text-align:left">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:var(--muted2)">${chevB}</span>
          <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text)">📈 Employee Bar Chart</span>
        </div>
        <span style="font-size:9px;color:var(--muted2)">Sorted High→Low</span>
      </button>
      <div id="trendBarBody" style="display:${_barSectionOpen?'block':'none'};padding:0 14px 14px">
        <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
          <button onclick="downloadTrendBar()" title="Download as Image" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--card2);color:var(--muted2);font-size:11px;font-weight:700;cursor:pointer">⬇️ Save PNG</button>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px">${metricBtns}</div>
        <div id="trendBarChartBars">${barHtml}</div>
      </div>
    </div>`;
}

function sortTrends(col){
  if(_trendSortCol === col){
    _trendSortDir = _trendSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    _trendSortCol = col;
    _trendSortDir = col === 'name' ? 'asc' : 'desc'; // numbers default High→Low
  }
  // Re-render with current schedule state
  let dates;
  if(_customRangeActive && _customDateFrom && _customDateTo){
    const d=new Date(_customDateFrom), e=new Date(_customDateTo);
    dates=[]; let cur=new Date(d);
    while(cur<=e){ dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }
  } else {
    dates=Array.from({length:_schedDayCount()},(_,i)=>addDays(TODAY_STR,schedOff+i));
  }
  const allEmps = (
    getSchedFilteredEmps()
  ).filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length > 0);
  renderShiftTrends(allEmps, dates);
}
function setTrendBar(metric){
  _trendBarMetric = metric;
  // Re-render trends with same dates/emps
  let dates;
  if(_customRangeActive && _customDateFrom && _customDateTo){
    const d=new Date(_customDateFrom), e=new Date(_customDateTo);
    dates=[]; let cur=new Date(d);
    while(cur<=e){ dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }
  } else {
    dates=Array.from({length:_schedDayCount()},(_,i)=>addDays(TODAY_STR,schedOff+i));
  }
  const allEmps = (
    getSchedFilteredEmps()
  ).filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length > 0);
  renderShiftTrends(allEmps, dates);
}
async function downloadTrendBar(){
  const box = document.getElementById('trendBarChartBox');
  if(!box){ toast('⚠️ Chart not found'); return; }
  const btn = box.querySelector('button[onclick="downloadTrendBar()"]');
  if(btn){ btn.style.display='none'; }

  // ── Wrap chart in a branded container for download ──
  const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#1a2232';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:fixed;top:-99999px;left:0;background:${cardBg};padding:18px;width:${Math.max(box.offsetWidth, 800)}px;font-family:'Barlow Condensed',Arial,sans-serif;`;

  // Branding header
  const brandHdr = document.createElement('div');
  brandHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid rgba(255,255,255,0.12)';
  const rangeLbl = (_customRangeActive && _customDateFrom && _customDateTo)
    ? `${_customDateFrom} → ${_customDateTo}`
    : 'Recent 16 days';
  brandHdr.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <img src="vkslogo512.png" crossorigin="anonymous" alt="VKS Tech" style="width:48px;height:48px;border-radius:12px;object-fit:contain;background:#fff;padding:2px" onerror="this.style.display='none'"/>
      <div>
        <div style="font-size:18px;font-weight:900;color:#fff;line-height:1.15;letter-spacing:0.2px">Made by VKS Tech</div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600">vkstech.com</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:15px;font-weight:900;color:#fff">Shift Trend Report</div>
      <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-top:2px">${rangeLbl}</div>
    </div>`;

  // Footer
  const brandFtr = document.createElement('div');
  brandFtr.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;color:#94a3b8;font-weight:600';
  brandFtr.innerHTML = `
    <img src="vkslogo512.png" crossorigin="anonymous" style="width:14px;height:14px;border-radius:3px" onerror="this.style.display='none'"/>
    <span>Made by <b style="color:#fff">VKS Tech</b> · vkstech.com · Generated ${new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;

  // Clone the chart box (so we don't disturb the live one)
  const boxClone = box.cloneNode(true);
  const cloneBtn = boxClone.querySelector('button[onclick="downloadTrendBar()"]');
  if(cloneBtn) cloneBtn.remove();

  // Remove zero-value bars from the clone so PNG stays clean
  // (on-screen view still shows them for transparency)
  const zeroRows = boxClone.querySelectorAll('#trendBarChartBars > div[data-val="0"]');
  let hiddenCount = 0;
  zeroRows.forEach(r => { r.remove(); hiddenCount++; });
  // If ALL bars had zero values, keep the clone as-is with a friendly message
  const barsContainer = boxClone.querySelector('#trendBarChartBars');
  if(barsContainer && !barsContainer.children.length){
    barsContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:12px">No data for this metric in selected range</div>';
  }

  wrapper.appendChild(brandHdr);
  wrapper.appendChild(boxClone);
  wrapper.appendChild(brandFtr);
  document.body.appendChild(wrapper);

  try{
    // Wait for logo images to load (else they appear blank in canvas)
    const imgs = wrapper.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img => {
      if(img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => {
        img.onload = res; img.onerror = res;
        setTimeout(res, 2000);
      });
    }));
    await new Promise(r=>setTimeout(r,200));

    const canvas = await html2canvas(wrapper, {
      backgroundColor: cardBg,
      scale: 2,
      useCORS: true,
      logging: false
    });
    if(btn){ btn.style.display=''; }
    const bm = ['L','Ab','HLF','O','D','N'].find(k=>k===_trendBarMetric) || _trendBarMetric;
    const labelMap = {L:'Leave',Ab:'Absent',HLF:'HalfDay',O:'Off',D:'Day',N:'Night'};
    const rangeStr = (_customRangeActive && _customDateFrom && _customDateTo)
      ? _customDateFrom+'_to_'+_customDateTo
      : 'recent';
    const fname = `ShiftTrend_${labelMap[bm]||bm}_${rangeStr}.png`;
    const link = document.createElement('a');
    link.download = fname;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('✅ Chart saved: '+fname);
  } catch(e){
    if(btn){ btn.style.display=''; }
    toast('⚠️ Download failed: '+e.message);
  } finally {
    if(wrapper.parentNode) document.body.removeChild(wrapper);
  }
}
let _lvFilter='all';
function setLF(f,el){ _lvFilter=f; document.querySelectorAll('#leaveFilter .chip').forEach(c=>c.classList.remove('on')); el.classList.add('on'); renderLeaves(); }


function updateLeaveFilterCounts(){
  try{
    const all = (typeof getLeaves==='function' ? getLeaves() : []) || [];
    const mine = (typeof isAdmin==='function' && isAdmin()) || (typeof isMgr==='function' && isMgr())
      ? all
      : all.filter(l => {
          const id = (SESSION && (SESSION.empObjId||SESSION.empId||''));
          return !id || l.empId===id || l.empObjId===id || l.empName===SESSION.name;
        });
    const n = {
      all: mine.length,
      pending: mine.filter(l=>l.status==='pending').length,
      approved: mine.filter(l=>l.status==='approved').length,
      rejected: mine.filter(l=>l.status==='rejected').length
    };
    const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=String(v); };
    set('lfCountAll', n.all);
    set('lfCountPending', n.pending);
    set('lfCountApproved', n.approved);
    set('lfCountRejected', n.rejected);
  }catch(e){}
}


// ════════════════════════════════════════
// LEAVES / SHIFT HISTORY DOWNLOAD (Member + Manager)
// ════════════════════════════════════════
function openLeaveDownloadPanel(){
  const existing = document.getElementById('leaveDownloadPanel');
  if(existing){ existing.style.display = existing.style.display==='none'?'block':'none'; return; }
  const host = document.getElementById('leaveList');
  if(!host) return;
  const panel = document.createElement('div');
  panel.id = 'leaveDownloadPanel';
  panel.style.cssText = 'background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:12px;margin-bottom:12px';
  const isEn = (typeof _lang!=='undefined' && _lang!=='hi');
  panel.innerHTML = `
    <div style="font-size:13px;font-weight:900;margin-bottom:8px">📥 ${(typeof L==='function')?L('रिकॉर्ड डाउनलोड','Download records'):'Download records'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div>
        <label style="font-size:10px;color:var(--muted2);font-weight:700">${(typeof L==='function')?L('प्रकार','Type'):'Type'}</label>
        <select id="ldType" class="inp-field" style="width:100%;margin-top:4px">
          <option value="leaves_all">All Leaves</option>
          <option value="leaves_approved">Approved Leaves</option>
          <option value="leaves_pending">Pending Leaves</option>
          <option value="coff">C-Off / Comp Off</option>
        </select>
      </div>
      <div>
        <label style="font-size:10px;color:var(--muted2);font-weight:700">${(typeof L==='function')?L('से','From'):'From'}</label>
        <input type="date" id="ldFrom" class="inp-field" style="width:100%;margin-top:4px">
      </div>
      <div>
        <label style="font-size:10px;color:var(--muted2);font-weight:700">${(typeof L==='function')?L('तक','To'):'To'}</label>
        <input type="date" id="ldTo" class="inp-field" style="width:100%;margin-top:4px">
      </div>
      <div style="display:flex;align-items:flex-end">
        <button type="button" onclick="downloadLeaveOrShiftRecords()" class="submit-btn" style="width:100%;padding:10px;border-radius:10px;font-weight:800;border:none;cursor:pointer;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff">
          📥 Download Excel
        </button>
      </div>
    </div>
    <div style="font-size:10px;color:var(--muted2)">${(typeof L==='function')?L('आपके अपने रिकॉर्ड · तारीख चुनें · प्रकार चुनें','Your own records · pick type & dates'):'Your records · pick type & dates'}</div>
  `;
  host.parentNode.insertBefore(panel, host);
  // default: current month
  try{
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const from = new Date(y, m, 1);
    const to = new Date(y, m+1, 0);
    const iso = d => d.toISOString().slice(0,10);
    document.getElementById('ldFrom').value = iso(from);
    document.getElementById('ldTo').value = iso(to);
  }catch(e){}
}

async function downloadLeaveOrShiftRecords(){
  const type = (document.getElementById('ldType')||{}).value || 'leaves_all';
  const from = (document.getElementById('ldFrom')||{}).value || '';
  const to = (document.getElementById('ldTo')||{}).value || '';
  if(!from || !to){ toast(L('⚠️ From / To date चुनें','⚠️ Select From / To dates')); return; }
  if(from > to){ toast(L('⚠️ From date, To से पहले हो','⚠️ From date must be before To')); return; }

  const myId = SESSION.empObjId || SESSION.empId || '';
  const myName = SESSION.name || 'Member';
  const myMobile = String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
  const genAt = new Date().toLocaleString('en-IN');

  const rows = [];
  let sheetTitle = 'Records';

  if(type.startsWith('leaves') || type === 'coff'){
    let list = (typeof getLeaves==='function' ? getLeaves() : []) || [];
    // Own records only (managers still download own unless admin viewing — keep member-safe)
    list = list.filter(l=>{
      if(!l) return false;
      const ids = [String(l.empId||''), String(l.empObjId||'')];
      if(myId && (ids.includes(String(myId)) || ids.includes(String(SESSION.empId||'')))) return true;
      // name+mobile soft match
      if(l.empName && SESSION.name && String(l.empName).toLowerCase()===String(SESSION.name).toLowerCase()) return true;
      return false;
    });
    if(type === 'leaves_approved') list = list.filter(l=>l.status==='approved');
    if(type === 'leaves_pending') list = list.filter(l=>l.status==='pending');
    if(type === 'coff') list = list.filter(l=>{
      const t = String(l.leaveType||l.type||'');
      return /C-?Off|Comp|CO/i.test(t) || l.type==='CO';
    });
    list = list.filter(l=>{
      const f = String(l.from||'').slice(0,10);
      const t2 = String(l.to||l.from||'').slice(0,10);
      if(!f) return false;
      return f <= to && t2 >= from;
    });
    list.sort((a,b)=> String(a.from).localeCompare(String(b.from)));
    sheetTitle = type==='coff' ? 'C-Off' : 'Leaves';
    rows.push(['Man Power App — '+sheetTitle+' Report']);
    rows.push(['VKS Tech — Technology is power']);
    rows.push(['Member', myName, 'Mobile', myMobile]);
    rows.push(['From', from, 'To', to, 'Generated', genAt]);
    rows.push([]);
    rows.push(['#','Type','Status','From','To','Days','Reason','C-Off / Shift Date','Applied On']);
    list.forEach((l,i)=>{
      rows.push([
        i+1,
        l.leaveType || l.type || 'Leave',
        l.status || '',
        l.from || '',
        l.to || l.from || '',
        l.days || '',
        l.reason || '',
        l.coffDate || '',
        (l.appliedAt || l.createdAt || '').toString().slice(0,16)
      ]);
    });
    if(!list.length) rows.push(['—','No records in range']);
  } else {
    // Shift history for logged-in employee
    const emp = (typeof myEmp==='function' ? myEmp() : null)
      || (getEmps()||[]).find(e=>e.id===SESSION.empObjId || e.empId===SESSION.empId);
    if(!emp){ toast(L('⚠️ Employee profile नहीं मिला','⚠️ Employee profile not found')); return; }
    const want = type.replace('shift_',''); // H, Ab, L, O, D, N, G, CO, all
    sheetTitle = 'Shifts_'+want;
    rows.push(['Man Power App — Shift History']);
    rows.push(['VKS Tech — Technology is power']);
    rows.push(['Member', emp.name||myName, 'Code', emp.empId||'', 'Mobile', myMobile]);
    rows.push(['Filter', want==='all'?'All codes':want, 'From', from, 'To', to]);
    rows.push(['Generated', genAt]);
    rows.push([]);
    rows.push(['#','Date','Day','Shift Code','Meaning']);
    const meaning = {D:'Day',N:'Night',A:'A',B:'B',C:'C',O:'Weekly Off',L:'Leave','C/O':'Comp Off',CO:'Comp Off',H:'Holiday',Ab:'Absent',G:'General',GP:'Gate Pass',HLF:'Half Day',OD:'Other Dept'};
    let n = 0;
    const cur = new Date(from+'T12:00:00');
    const end = new Date(to+'T12:00:00');
    while(cur <= end){
      const ymd = cur.toISOString().slice(0,10);
      let sh = '';
      try{ sh = (typeof getShift==='function') ? String(getShift(emp, ymd)||'') : ''; }catch(e){}
      const code = sh;
      const up = code.toUpperCase();
      let match = false;
      if(want==='all') match = !!code;
      else if(want==='CO') match = (up==='C/O'||up==='CO'||up==='C-OFF');
      else if(want==='Ab') match = (typeof _isAbsentShift==='function' ? _isAbsentShift(code) : /^Ab/i.test(code));
      else match = (up === want.toUpperCase() || code === want);
      if(match){
        n++;
        const day = cur.toLocaleDateString('en-IN',{weekday:'short'});
        rows.push([n, ymd, day, code||'—', meaning[code]||meaning[up]||'']);
      }
      cur.setDate(cur.getDate()+1);
    }
    if(!n) rows.push(['—','No matching shifts in range']);
  }

  const fileBase = 'ManPower_'+sheetTitle+'_'+from+'_to_'+to;

  try{
    try{ await _ensureXlsxLib(); }catch(e){}
    if(window.XLSX){
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0,31));
      XLSX.writeFile(wb, fileBase + '.xlsx');
      toast('📤 Excel downloaded');
      return;
    }
  }catch(e){ console.warn(e); }

  // CSV fallback
  const csv = rows.map(r=>r.map(c=>{
    const s = String(c==null?'':c);
    return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileBase + '.csv';
  a.click();
  toast('📤 CSV downloaded');
}

function renderLeaves(){
  try{ updateLeaveFilterCounts(); }catch(e){}
  // Leave-only download (not shifts — shifts are on My Shift tab)
  try{
    if(!document.getElementById('leaveDlBtn')){
      const title = document.getElementById('pageTitleLeaves') || document.querySelector('#tab-leave .page-title');
      if(title && title.parentNode){
        const btn = document.createElement('button');
        btn.id = 'leaveDlBtn';
        btn.type = 'button';
        btn.textContent = (typeof L==='function')?L('📥 Leave Download','📥 Leave Download'):'📥 Leave Download';
        btn.onclick = function(){ openLeaveDownloadPanel(); };
        btn.style.cssText = 'margin:8px 0 10px;padding:8px 14px;border-radius:10px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;font-size:12px;cursor:pointer';
        title.parentNode.insertBefore(btn, title.nextSibling);
      }
    }
  }catch(e){}

  let list = getLeaves().filter(l=> {
    if(isAdmin()) return true;
    if(canApproveLeave()) return true; // Manager / delegated leave approver sees team leave
    // Own leaves: show all statuses
    if(l.empId===SESSION.empObjId) return true;
    // Others' leaves: show only approved or rejected
    if(l.status==='approved' || l.status==='rejected') return true;
    return false;
  });
  if(_lvFilter!=='all') list=list.filter(l=>l.status===_lvFilter);
  list.sort((a,b)=>new Date(b.from)-new Date(a.from));

  document.getElementById('leaveList').innerHTML = list.length ? list.map(l=>{
    const s=SEC[l.section]||SEC.M1;
    const ra = l.reallocations&&l.reallocations.length ? `<div style="background:var(--bg2);border:1px solid rgba(163,230,53,.2);border-radius:10px;padding:10px;margin-top:10px">
      <div style="font-size:10px;font-weight:700;color:var(--sup);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">${L('🔄 शिफ्ट पुनर्आवंटन','🔄 Shift reallocation')}</div>
      ${l.reallocations.map(r=>`<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted2)">${fmtShort(r.date)}</span><span style="font-weight:700">${r.coveredBy}</span><span style="color:var(--sup)">${r.fromShift}→${r.toShift}</span></div>`).join('')}
    </div>`:'' ;
    return `<div class="card">
      <div class="card-row">
        <div class="card-ico" style="background:var(--daybg)">📅</div>
        <div class="card-body">
          <div class="card-name">${l.empName}${(()=>{ const c=l.empCode||l.empNo||''; if(c) return ` <span style="font-size:12px;font-weight:700;color:var(--muted2)">· #${escHtml(String(c))}</span>`; const emp=(getEmps()||[]).find(e=>e.id===l.empId||e.empId===l.empId); const code=emp&&emp.empId?emp.empId:''; return code?` <span style="font-size:12px;font-weight:700;color:var(--muted2)">· #${escHtml(String(code))}</span>`:''; })()}</div>
          <div class="card-tags"><span class="badge ${l.section}">${(typeof secName==='function'?secName(l.section):null)||s.label||s.hi||l.section||''}</span><span class="badge ${l.status}">${{pending:L('⏳ प्रतीक्षा','⏳ Pending'),approved:L('✅ मंजूर','✅ Approved'),rejected:L('❌ अस्वीकार','❌ Rejected')}[l.status]}</span></div>
          <div class="card-sub" style="margin-top:6px">${l.leaveType||L('छुट्टी','Leave')} · <b>${l.days}</b> ${L('दिन','days')}${l.coffDate?` · <span style="color:#f97316;font-weight:700">📅 Shift: ${l.coffDate}</span>`:''}</div>
          <div class="card-meta">${fmtDate(l.from)}${l.from!==l.to?' → '+fmtDate(l.to):''}</div>
          ${l.reason?`<div style="margin-top:6px;padding:7px 10px;background:var(--card2);border-left:3px solid var(--day);border-radius:0 8px 8px 0;font-size:12px;color:var(--text);font-weight:600">📝 ${escHtml(l.reason)}</div>`:`<div style="margin-top:4px;font-size:11px;color:var(--lv);font-weight:600">⚠️ ${L('कारण नहीं दिया गया','No reason given')}</div>`}
        </div>
      </div>${ra}
      ${(() => {
        const k = l._key||l.id||'';
        const canMgr = canApproveLeave();
        if(!canMgr) return '';
        if(l.status==='pending'){
          return `<div class="action-row">
        <button type="button" class="act-btn approve" data-leave-key="${k}" onclick="event.stopPropagation();actLeave(this.getAttribute('data-leave-key')||'','approved')">✅ Approve</button>
        <button type="button" class="act-btn reject"  data-leave-key="${k}" onclick="event.stopPropagation();actLeave(this.getAttribute('data-leave-key')||'','rejected')">❌ Reject</button>
        <button type="button" class="act-btn edit" data-leave-key="${k}" onclick="event.stopPropagation();openEditLeaveForm(this.getAttribute('data-leave-key')||'')">✏️ Edit</button>
        <button type="button" class="act-btn reject" data-leave-key="${k}" onclick="event.stopPropagation();deleteLeaveRecord(this.getAttribute('data-leave-key')||'')">🗑️ Delete</button>
      </div>`;
        }
        if(l.status==='approved'){
          return `<div class="action-row">
        <button type="button" class="act-btn edit" data-leave-key="${k}" onclick="event.stopPropagation();openEditLeaveForm(this.getAttribute('data-leave-key')||'')">✏️ Edit</button>
        <button type="button" class="act-btn reject" data-leave-key="${k}" onclick="event.stopPropagation();deleteLeaveRecord(this.getAttribute('data-leave-key')||'')">🗑️ Delete</button>
      </div>`;
        }
        return '';
      })()}
    </div>`;
  }).join('') : `<div class="empty"><div class="empty-icon">🌴</div><div class="empty-text">${L('कोई छुट्टी आवेदन नहीं','No leave applications')}</div></div>`;
}

function openLeaveForm(){
  const emps=getEmps();
  const me=myEmp();
  const empOptions = isAdmin()
    ? emps.map(e=>`<option value="${e.id}">${e.name} (${e.empId||'—'})</option>`).join('')
    : `<option value="${me?.id||''}">${me?.name||SESSION.name}</option>`;

  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">🌴 ${L('छुट्टी आवेदन','Leave application')}</div>
  <div class="field"><label>${L('कर्मचारी','Employee')}</label>
    <select id="lv_emp">${empOptions}</select></div>
  <div class="field"><label>${L('छुट्टी का प्रकार','Leave type')}</label>
    <select id="lv_type" onchange="onLvTypeChange(this)">
      <option value="Casual Leave">CL — Casual Leave (आकस्मिक)</option>
      <option value="Sick Leave">SL — Sick Leave (बीमारी)</option>
      <option value="Emergency Leave">EML — Emergency Leave (आपातकाल)</option>
      <option value="Earned Leave">EL — Earned Leave (अर्जित छुट्टी · Max 20)</option>
      <option value="C-Off">C-Off — Compensatory Off</option>
    </select></div>
  <div id="lv_el_info" style="display:none;margin:-4px 0 10px;padding:9px 12px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:9px">
    <span style="font-size:12px;color:var(--green);font-weight:700">📊 EL Balance: </span>
    <span id="lv_el_bal" style="font-size:12px;color:#fff;font-weight:700"></span>
  </div>
  <div id="coff_block" style="display:none">
    <div class="field" style="background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(168,85,247,0.08));border:1.5px solid #f97316;border-radius:12px;padding:12px 14px;margin-bottom:4px">
      <label style="color:#f97316;font-weight:800">📅 किस Shift में आए थे? (C-Off Date)</label>
      <input type="date" id="lv_coffdate" value="${TODAY_STR}" style="width:100%;padding:10px;background:var(--card);border:1.5px solid var(--border2);border-radius:8px;color:var(--text);font-size:14px;margin-top:6px">
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">⚡ जिस दिन Extra Shift किया था वो date डालें</div>
    </div>
  </div>
  <div class="grid2">
    <div class="field"><label>से तारीख</label><input type="date" id="lv_from" value="${TODAY_STR}"></div>
    <div class="field"><label>तक तारीख</label><input type="date" id="lv_to" value="${TODAY_STR}"></div>
  </div>
  <div class="field">
    <label style="color:var(--lv)">कारण * (अनिवार्य)</label>
    <div id="lv_reason_chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px"></div>
    <textarea id="lv_reason" placeholder="छुट्टी का कारण लिखें... (अनिवार्य)" style="border-color:rgba(244,63,94,.3)" oninput="this.style.borderColor=this.value.trim()?'var(--border2)':'rgba(244,63,94,.3)'"></textarea>
  </div>
  <button class="submit-btn" onclick="submitLeave()">📤 आवेदन भेजें</button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);

  document.getElementById('lv_type').addEventListener('change', function(){ onLvTypeChange(this); });
  // Set initial reason chips after modal is in DOM
  setTimeout(()=>{ onLvTypeChange(document.getElementById('lv_type')); }, 50);
}
function onLvTypeChange(sel){
  const v = sel ? sel.value : (document.getElementById('lv_type')||{}).value;
  const coffBlock = document.getElementById('coff_block');
  if(coffBlock) coffBlock.style.display = v==='C-Off' ? 'block':'none';
  const elInfo = document.getElementById('lv_el_info');
  if(elInfo && v==='Earned Leave'){
    const empId = (document.getElementById('lv_emp')||{}).value||'';
    const used = getLeaves().filter(l=>l.empId===empId&&l.leaveType==='Earned Leave'&&l.status!=='rejected').reduce((s,l)=>s+(l.days||1),0);
    document.getElementById('lv_el_bal').textContent = used+' used · '+(20-used)+' available / 20 max';
    elInfo.style.display='block';
  } else if(elInfo){ elInfo.style.display='none'; }

  // ── Quick reason chips based on leave type ──
  const REASON_MAP = {
    'Sick Leave':       ['बुखार / Fever','सर्दी-खाँसी','पेट दर्द','चोट / Injury','Hospital Visit','Doctor Appointment','Family Member Sick'],
    'Casual Leave':     ['व्यक्तिगत कार्य','घर का काम','बाहर जाना है','शादी समारोह','पारिवारिक कार्यक्रम','थकान / Rest','Other Personal Work'],
    'Emergency Leave':  ['घर में आपातकाल','परिवार की बीमारी','दुर्घटना','अचानक यात्रा','मृत्यु / Bereavement','Emergency Medical'],
    'Earned Leave':     ['वार्षिक छुट्टी','घर जाना है','लंबी यात्रा','परिवार से मिलना','त्योहार','शादी / Marriage'],
    'C-Off':            ['Extra shift की थी','W-Off पर duty','Holiday पर काम','Emergency duty'],
  };
  const chips = REASON_MAP[v] || ['व्यक्तिगत कारण','पारिवारिक कारण','Other'];
  const chipsEl = document.getElementById('lv_reason_chips');
  if(!chipsEl) return;
  chipsEl.innerHTML = chips.map(r =>
    `<button type="button" onclick="selectLeaveReason(this,'${r.replace(/'/g,'\\&#39;')}')"
      style="padding:7px 12px;border-radius:20px;border:1.5px solid var(--border2);
      background:var(--card);color:var(--muted2);font-size:12px;font-weight:700;
      cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap">${r}</button>`
  ).join('');
}

function selectLeaveReason(btn, reason){
  // Toggle chip selection
  document.querySelectorAll('#lv_reason_chips button').forEach(b=>{
    b.style.background='var(--card)'; b.style.color='var(--muted2)'; b.style.borderColor='var(--border2)';
  });
  btn.style.background='rgba(249,115,22,.12)'; btn.style.color='var(--m1)'; btn.style.borderColor='var(--m1)';
  const ta=document.getElementById('lv_reason');
  if(ta){ ta.value=reason; ta.style.borderColor='var(--border2)'; }
}

async function submitLeave(){
  const empId=document.getElementById('lv_emp').value;
  const from=document.getElementById('lv_from').value;
  const to=document.getElementById('lv_to').value;
  const type=document.getElementById('lv_type').value;
  const reason=document.getElementById('lv_reason').value.trim();
  if(!empId||!from||!to){ toast(L('सभी जानकारी भरें','Fill in all details')); return; }
  if(!reason){
    const ta=document.getElementById('lv_reason');
    if(ta){ ta.style.borderColor='var(--lv)'; ta.focus(); }
    toast(L('⚠️ कारण लिखना अनिवार्य है','⚠️ Reason is required')); return;
  }
  const emp=getEmps().find(e=>e.id===empId);
  if(!emp){ toast(L('कर्मचारी नहीं मिला','Employee not found')); return; }
  const days=dateRange(from,to).length;
  // C-Off: get the shift date user came on
  const coffDateEl = document.getElementById('lv_coffdate');
  const coffDate = (type==='C-Off' && coffDateEl) ? coffDateEl.value : null;
  if(type==='C-Off' && !coffDate){ toast(L('⚠️ C-Off के लिए Shift Date जरूरी है','⚠️ Shift date is required for C-Off')); return; }

  // ── DUPLICATE CHECK: block if any existing leave overlaps same dates ──
  const newDates = dateRange(from, to);
  const existingLvs = getLeaves().filter(l => l.empId===empId && l.status!=='rejected');
  for(const el of existingLvs){
    const exDates = dateRange(el.from, el.to);
    const clash = newDates.filter(d => exDates.includes(d));
    if(clash.length){
      const clashStr = clash.map(d=>new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})).join(', ');
      toast(L('⚠️ Duplicate Leave! इन dates पर पहले से application है: ','⚠️ Duplicate leave! Already applied for: ') + clashStr); return;
    }
  }

  // ── EL CAP: max 20 days Earned Leave per employee ──
  if(type==='Earned Leave'){
    const usedEL = getLeaves().filter(l=>l.empId===empId&&l.leaveType==='Earned Leave'&&l.status!=='rejected').reduce((s,l)=>s+(l.days||1),0);
    if(usedEL + days > 20){ toast(L('⚠️ EL Limit पार! Available: ','⚠️ EL limit exceeded! Available: ')+(20-usedEL)+L(' दिन',' days')); return; }
  }

  const key=await fbPush('leaves',{
    empId:emp.id, empName:emp.name, empCode: emp.empId||'', section:emp.sec,
    from, to, days, leaveType:type, reason,
    coffDate: coffDate||null,
    status:'pending', appliedAt:new Date().toISOString(), reallocations:[]
  });
  // Store the key for reference
  await fbUpdate(`leaves/${key}`, {_key:key});
  closeModal();
  toast(L('✅ छुट्टी आवेदन भेज दिया गया!','✅ Leave application submitted!'));
  // In-app always + WhatsApp to mapped manager if template ON
  try{
    const mgrId = emp.managerId || SESSION.managerId || '';
    const datesStr = (from===to) ? from : (from+' → '+to);
    await _notifyMappedManagerAfterMemberAction('leave', {
      managerId: mgrId,
      empObjId: emp.id,
      name: emp.name,
      dates: datesStr,
      date: from,
      leaveType: type,
      reason: reason,
      days: days,
      reqKey: key,
      notifBody: (emp.name||'')+' · '+datesStr+' · '+(type||'Leave')
    });
  }catch(e){ console.warn('[leave notify mgr]', e); }
}

async function actLeave(key, status){
  if(!canApproveLeave()){ toast(L('❌ Leave approve permission नहीं है','❌ No leave approve permission')); return; }
  key = String(key||'').trim();
  if(!key || key==='undefined' || key==='null'){
    // Last resort: reload leaves from Firebase with keys
    try{
      const snap = await fbGet('leaves');
      _cache.leaves = _normalizeLeavesSnap(snap);
      const pending = (getLeaves()||[]).filter(l=>l.status==='pending');
      if(pending.length===1) key = pending[0]._key||pending[0].id||'';
    }catch(e){}
  }
  if(!key || key==='undefined' || key==='null'){
    toast(L('❌ Leave key missing — app data refresh हो रहा है, 2 सेकंड बाद Approve फिर दबाएँ','❌ Leave key missing — data refreshing, try Approve again in 2 seconds'));
    try{
      const snap = await fbGet('leaves');
      _cache.leaves = _normalizeLeavesSnap(snap);
      if(typeof renderPending==='function') renderPending();
    }catch(e){}
    return;
  }
  // Phone auth required by Firebase rules
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(L('❌ Phone OTP verify करें — फिर Approve दबाएँ','❌ Verify phone OTP — then press Approve')); return; }
    }
  }catch(e){ toast('❌ Auth: '+(e.message||e)); return; }

  let leave = (getLeaves()||[]).find(l=>l && (l._key===key || l.id===key));
  if(!leave){
    try{
      const remote = await fbGet('leaves/'+key);
      if(remote) leave = {...remote, _key:key};
    }catch(e){}
  }
  if(!leave){
    toast(L('❌ Leave record नहीं मिला: ','❌ Leave record not found: ')+key);
    return;
  }
  try{
    if(status==='approved'){
      let suggestion = null;
      try{ suggestion = checkShiftCoverage(leave); }catch(e){ suggestion=null; }
      if(suggestion && suggestion.length){
        showWarnModal(leave, suggestion, key);
        return;
      }
      await approveLeave(key, leave, []);
    } else {
      await fbUpdate('leaves/'+key, { status:'rejected', rejectedAt:new Date().toISOString(), rejectedBy:SESSION.name||'' });
      try{
        if(_cache.leaves){
          const ix=_cache.leaves.findIndex(l=>l._key===key||l.id===key);
          if(ix>=0) _cache.leaves[ix].status='rejected';
        }
      }catch(e){}
      toast('❌ Leave rejected');
      try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
      try{ if(typeof renderLeaves==='function') renderLeaves(); }catch(e){}
    }
  }catch(err){
    console.error('[actLeave]', err);
    toast(L('❌ Approve failed: ','❌ Approve failed: ')+(err.message||err.code||err)+L(' — Phone OTP + rules check करें',' — verify Phone OTP + rules'));
  }
}

/** Manager or leave-authorized member: edit approved/pending leave (dates, reason, type) */
function openEditLeaveForm(key){
  if(!canApproveLeave()){ toast(L('❌ Leave edit permission नहीं है','❌ No leave edit permission')); return; }
  key = String(key||'').trim();
  const leave = (getLeaves()||[]).find(l=>l && (l._key===key || l.id===key));
  if(!leave){ toast(L('❌ Leave record नहीं मिला','❌ Leave record not found')); return; }
  const types = ['Casual Leave','Sick Leave','Emergency Leave','Earned Leave','C-Off'];
  const typeOpts = types.map(t=>`<option value="${t}" ${leave.leaveType===t?'selected':''}>${t}</option>`).join('');
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">✏️ Edit Leave — ${escHtml(leave.empName||'')}</div>
  <div style="font-size:12px;color:var(--muted2);margin:-6px 0 12px">Status: <b style="color:var(--text)">${leave.status}</b> · Manager / authorized only</div>
  <div class="field"><label>Leave Type</label>
    <select id="elv_type">${typeOpts}</select></div>
  <div class="grid2">
    <div class="field"><label>From</label><input type="date" id="elv_from" value="${leave.from||''}"></div>
    <div class="field"><label>To</label><input type="date" id="elv_to" value="${leave.to||''}"></div>
  </div>
  <div class="field" id="elv_coff_wrap" style="${leave.leaveType==='C-Off'?'':'display:none'}">
    <label>C-Off Shift Date</label>
    <input type="date" id="elv_coffdate" value="${leave.coffDate||''}">
  </div>
  <div class="field"><label>Reason</label>
    <textarea id="elv_reason" rows="3" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border2);background:var(--card);color:var(--text);font-family:inherit;font-size:13px;resize:vertical">${escHtml(leave.reason||'')}</textarea>
  </div>
  <button class="submit-btn" onclick="saveEditedLeave('${key}')">💾 Save Changes</button>
  <button type="button" onclick="closeModal()" style="width:100%;margin-top:8px;padding:12px;border-radius:12px;border:1px solid var(--border2);background:transparent;color:var(--muted2);font-weight:700;cursor:pointer">Cancel</button>
  <script>
    (function(){
      var sel=document.getElementById('elv_type');
      if(sel) sel.onchange=function(){
        var w=document.getElementById('elv_coff_wrap');
        if(w) w.style.display = this.value==='C-Off' ? '' : 'none';
      };
    })();
  </script>`);
}

async function saveEditedLeave(key){
  if(!canApproveLeave()){ toast(L('❌ Leave edit permission नहीं है','❌ No leave edit permission')); return; }
  key = String(key||'').trim();
  const from = (document.getElementById('elv_from')||{}).value;
  const to = (document.getElementById('elv_to')||{}).value;
  const leaveType = (document.getElementById('elv_type')||{}).value;
  const reason = ((document.getElementById('elv_reason')||{}).value||'').trim();
  const coffDate = (document.getElementById('elv_coffdate')||{}).value || null;
  if(!from||!to){ toast(L('तारीख भरें','Enter dates')); return; }
  if(!reason){ toast(L('⚠️ कारण जरूरी है','⚠️ Reason is required')); return; }
  if(new Date(to) < new Date(from)){ toast(L('❌ To date From से पहले नहीं हो सकती','❌ To date cannot be before From')); return; }
  if(leaveType==='C-Off' && !coffDate){ toast(L('⚠️ C-Off के लिए Shift Date जरूरी','⚠️ Shift date is required for C-Off')); return; }
  const days = dateRange(from, to).length;
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(L('❌ Phone OTP verify करें','❌ Verify phone OTP')); return; }
    }
  }catch(e){ toast('❌ Auth: '+(e.message||e)); return; }
  try{
    const patch = {
      from, to, days, leaveType, reason,
      coffDate: leaveType==='C-Off' ? coffDate : null,
      editedAt: new Date().toISOString(),
      editedBy: SESSION.name||''
    };
    await fbUpdate('leaves/'+key, patch);
    try{
      if(_cache.leaves){
        const ix=_cache.leaves.findIndex(l=>l._key===key||l.id===key);
        if(ix>=0) Object.assign(_cache.leaves[ix], patch);
      }
    }catch(e){}
    closeModal();
    toast('✅ Leave updated');
    try{ if(typeof renderLeaves==='function') renderLeaves(); }catch(e){}
    try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
    try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
  }catch(err){
    console.error('[saveEditedLeave]', err);
    toast('❌ Update failed: '+(err.message||err.code||err));
  }
}

async function deleteLeaveRecord(key){
  if(!canApproveLeave()){ toast(L('❌ Leave delete permission नहीं है','❌ No leave delete permission')); return; }
  key = String(key||'').trim();
  const leave = (getLeaves()||[]).find(l=>l && (l._key===key || l.id===key));
  if(!leave){ toast(L('❌ Leave record नहीं मिला','❌ Leave record not found')); return; }
  const ok = await confirmModal(
    '🗑️ Delete Leave',
    (leave.empName||'')+' · '+fmtDate(leave.from)+(leave.from!==leave.to?' → '+fmtDate(leave.to):'')+'\n'+(leave.leaveType||'')+' · '+leave.status+'\n\nDelete this leave permanently?',
    '🗑️ Delete',
    'Cancel',
    'act-btn reject'
  );
  if(!ok) return;
  try{
    if(typeof _ensureWriteAuth==='function'){
      const authOk = await _ensureWriteAuth();
      if(!authOk){ toast(L('❌ Phone OTP verify करें','❌ Verify phone OTP')); return; }
    }
  }catch(e){ toast('❌ Auth: '+(e.message||e)); return; }
  try{
    await fbRemove('leaves/'+key);
    try{
      if(_cache.leaves){
        _cache.leaves = _cache.leaves.filter(l=>!(l._key===key||l.id===key));
      }
    }catch(e){}
    toast('🗑️ Leave deleted');
    try{ if(typeof renderLeaves==='function') renderLeaves(); }catch(e){}
    try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
    try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
  }catch(err){
    console.error('[deleteLeaveRecord]', err);
    toast('❌ Delete failed: '+(err.message||err.code||err));
  }
}

function checkShiftCoverage(leave){
  const emps=getEmps();
  const suggestions=[];
  dateRange(leave.from,leave.to).forEach(d=>{
    const emp=emps.find(e=>e.id===leave.empId);
    if(!emp) return;
    const sh=getShift(emp,d);
    if(!['D','N'].includes(sh)) return;
    const secType=SEC[emp.sec]?.type;
    if(!secType||secType==='sup'||secType==='mgr') return;
    const min=secType==='metalliser'?CFG.minShift.metalliser:CFG.minShift.slitter;
    // Count same-section same-shift workers (excluding this employee)
    const sameSec=emps.filter(e=>e.sec===emp.sec&&e.id!==emp.id);
    const onDuty=sameSec.filter(e=>getShift(e,d)===sh).length;
    if(onDuty<min){
      // Find best supervisor to cover
      const supervisor=findBestSupervisor(secType, sh, d, emps);
      if(supervisor){
        suggestions.push({date:d,shift:sh,supervisor,section:emp.sec,secType});
      } else {
        suggestions.push({date:d,shift:sh,supervisor:null,section:emp.sec,secType});
      }
    }
  });
  return suggestions.length>0?suggestions:null;
}

function findBestSupervisor(secType, shift, date, emps){
  // Priority: 1 = Mohit/Dishant/Gurpreet, 2 = Ghanshyam/Anuj/Manjeet
  const candidates=[];
  Object.entries(SUP_COVERAGE).forEach(([name,cfg])=>{
    if(!cfg.covers.includes(secType)) return;
    const sup=emps.find(e=>e.name===name);
    if(!sup) return;
    const supShift=getShift(sup,date);
    
    // ❌ NOT available: weekly off, on leave, already same shift
    if(supShift==='O') return; // Weekly off — cannot ask
    if(supShift==='L') return; // On leave
    if(supShift==='C/O'||supShift==='CO') return; // Comp off
    
    // ✅ Already on requested shift — perfect, no extra burden
    if(supShift===shift){
      candidates.push({sup,cfg,currentShift:supShift,burden:0});
      return;
    }
    
    // ⚠️ On opposite shift — they worked already, shifting is burden
    // Only suggest if no one else available (burden=2)
    if(supShift==='D'||supShift==='N'){
      // Check: do they have enough rest? 
      // If they worked the previous 12hr shift, don't suggest opposite
      const prevDate = addDays(date,-1);
      const prevShift = getShift(sup,prevDate);
      // N shift person: if today N→D suggest, they'd have no rest
      if(prevShift===shift || supShift!==shift){
        candidates.push({sup,cfg,currentShift:supShift,burden:2});
      }
      return;
    }
    
    // General shift (G) — can be assigned
    if(supShift==='G'||supShift==='GP'){
      candidates.push({sup,cfg,currentShift:supShift,burden:1});
    }
  });
  
  // Sort: first by burden (0=best), then by priority
  candidates.sort((a,b)=> a.burden!==b.burden ? a.burden-b.burden : a.cfg.priority-b.cfg.priority);
  
  // Only return if burden is 0 or 1 (already on shift or general)
  // Never suggest someone on opposite shift (burden=2) unless no choice
  const best = candidates.find(c=>c.burden<=1) || candidates[0];
  
  if(best){
    best.sup._suggestedFromShift = best.currentShift;
    best.sup._burden = best.burden;
  }
  return best?.sup||null;
}

function showWarnModal(leave, suggestions, leaveKey){
  const validSuggestions=suggestions.filter(s=>s.supervisor);
  const html=`<div class="modal-handle"></div>
  <div class="warn-header"><div class="warn-icon">⚠️</div><div><div class="warn-title">शिफ्ट में कमी</div><div style="font-size:12px;color:var(--muted2)">${leave.empName} की छुट्टी मंजूर करने से</div></div></div>
  <div style="font-size:13px;color:var(--text);margin-bottom:12px">नीचे दी गई तारीखों में मैनपावर कम हो जाएगा:</div>
  ${suggestions.map(s=>`<div class="card" style="margin-bottom:8px">
    <div style="font-size:13px;font-weight:700;color:var(--lv)">${fmtDate(s.date)} · ${s.shift==='D'?'दिन':'रात'} शिफ्ट</div>
    <div style="font-size:12px;color:var(--muted2);margin-top:4px">${secName(s.section)} में न्यूनतम से कम होगा</div>
    ${s.supervisor?`<div class="suggestion-card">
      <div class="suggestion-name">💡 सुझाव: ${s.supervisor.name}</div>
      <div class="suggestion-reason">${
        s.supervisor._burden===0 ? '✅ पहले से '+( s.shift==='D'?'दिन':'रात')+' शिफ्ट में हैं — कोई extra burden नहीं' :
        s.supervisor._burden===1 ? '🟡 General shift में हैं — '+( s.shift==='D'?'दिन':'रात')+' शिफ्ट में लगाया जा सकता है' :
        '⚠️ '+( s.supervisor._suggestedFromShift==='N'?'रात':'दिन')+' शिफ्ट में हैं — shift change होगी, confirm करें'
      }</div>
    </div>`:'<div style="font-size:12px;color:var(--lv);padding:8px 0">⚠️ कोई उपलब्ध Supervisor नहीं</div>'}
  </div>`).join('')}
  <div class="action-row" style="margin-top:14px">
    <button class="act-btn approve" onclick="confirmApproveLeave('${leaveKey}')">✅ फिर भी मंजूर करें${validSuggestions.length>0?' + Supervisor लगाएं':''}</button>
    <button class="act-btn reject" onclick="closeWarnModal()">रद्द करें</button>
  </div>`;
  document.getElementById('warnBody').innerHTML=html;
  document.getElementById('warnOverlay').classList.add('open');
  document.getElementById('warnOverlay').onclick=closeWarnModal;
  document.getElementById('warnBody').onclick=e=>e.stopPropagation();
}

function closeWarnModal(){ document.getElementById('warnOverlay').classList.remove('open'); }

async function confirmApproveLeave(leaveKey){
  closeWarnModal();
  const leave=getLeaves().find(l=>l._key===leaveKey);
  if(!leave) return;
  const suggestions=checkShiftCoverage(leave)||[];
  await approveLeave(leaveKey, leave, suggestions);
}

async function approveLeave(leaveKey, leave, suggestions){
  suggestions = suggestions || [];
  leaveKey = String(leaveKey||leave._key||'').trim();
  if(!leaveKey){ toast('❌ Leave key missing'); return; }
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast('❌ Phone verify required'); return; }
    }
  }catch(e){}

  const reallocations=[];
  const ovUpdates={};

  // Mark leave in overrides
  (typeof dateRange==='function' ? dateRange(leave.from,leave.to) : [leave.from]).forEach(d=>{
    if(!d) return;
    ovUpdates[leave.empId+'_'+d]='L';
    // Dual-key: also write under Firebase id / empCode so getShift always finds it
    try{
      const empObj = (getEmps()||[]).find(e=>e.id===leave.empId || e.empId===leave.empId);
      if(empObj){
        if(empObj.id) ovUpdates[empObj.id+'_'+d]='L';
        if(empObj.empId) ovUpdates[empObj.empId+'_'+d]='L';
      }
    }catch(e){}
  });

  // Apply supervisor suggestions
  suggestions.forEach(s=>{
    if(s && s.supervisor){
      ovUpdates[s.supervisor.id+'_'+s.date]=s.shift;
      reallocations.push({date:s.date,coveredBy:s.supervisor.name,coveredById:s.supervisor.id,fromShift:getShift(s.supervisor,s.date)||'O',toShift:s.shift});
    }
  });

  try{
    // Prefer update of override keys only
    if(Object.keys(ovUpdates).length){
      try{ await fbUpdate('overrides', ovUpdates); }
      catch(e1){
        const existing=getOverrides()||{};
        await fbSet('overrides',{...existing,...ovUpdates});
      }
      try{ _cache.overrides = {...(getOverrides()||{}), ...ovUpdates}; }catch(e){}
    }

    await fbUpdate('leaves/'+leaveKey,{
      status:'approved',
      reallocations,
      approvedAt:new Date().toISOString(),
      approvedBy: SESSION.name||''
    });
    try{
      if(_cache.leaves){
        const ix=_cache.leaves.findIndex(l=>l._key===leaveKey||l.id===leaveKey);
        if(ix>=0){ _cache.leaves[ix].status='approved'; }
      }
    }catch(e){}
    toast('✅ Leave approved — schedule updated');
    try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
    try{ if(typeof renderLeaves==='function') renderLeaves(); }catch(e){}
    try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
  try{ if(typeof renderDeviceTransferRequests==='function') renderDeviceTransferRequests(); }catch(e){}
  }catch(err){
    console.error('[approveLeave]', err);
    toast('❌ Save failed: '+(err.message||err.code||err));
    return;
  }
  // continue existing WhatsApp block below — we only replaced up to toast

  // ── WhatsApp notification to employee ──
  try{
    const emp = getEmps().find(e => e.id === leave.empId || e.empId === leave.empId);
    if(emp && emp.phone && emp.phone.length === 10){
      const fromFmt = new Date(leave.from).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
      const toFmt   = new Date(leave.to  ).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
      const days = dateRange(leave.from, leave.to).length;
      const leaveTypeLabel = leave.type === 'CL' ? 'Casual Leave' : leave.type === 'SL' ? 'Sick Leave' : leave.type === 'EL' ? 'Earned Leave' : (leave.type||'Leave');
            let datesStr = fromFmt + (leave.from !== leave.to ? (' → ' + toFmt) : '') + ' (' + days + 'd)';
      if(leave.reason) datesStr += '\n' + leave.reason;
      if(reallocations.length > 0){
        datesStr += '\n';
        reallocations.forEach(r=>{
          const rFmt = new Date(r.date).toLocaleDateString(typeof mpLocale==='function'?mpLocale():'en-IN',{day:'numeric',month:'short'});
          datesStr += '• ' + rFmt + ': ' + r.coveredBy + '\n';
        });
      }
      let waMsg = (typeof buildWAForEmp==='function')
        ? buildWAForEmp('waLeaveApproved', emp, { dates: datesStr, reason: leaveTypeLabel||'' })
        : ('✅ Leave approved\n' + datesStr);
      if(typeof _appendWaAppLink==='function') waMsg = _appendWaAppLink(waMsg);
      setTimeout(()=>{ openWA(emp.phone, waMsg); }, 400);
    }
  }catch(waErr){ console.warn('[Leave WA] error:', waErr); }

  // Also push in-app notification
  try{
    await pushShiftNotification(leave.empId, leave.empName||'', leave.from, '', 'LEAVE_APPROVED', SESSION.name||'Admin');
  }catch(e){}

  renderAll();
}

// ════════════════════════════════════════
// RESIGNATION SYSTEM
// ════════════════════════════════════════
const RESIGN_REASONS = [
  {v:'new_job',        label:'🏢 नई नौकरी मिल गई (Got New Job)'},
  {v:'personal',       label:'👤 व्यक्तिगत कारण (Personal Reason)'},
  {v:'health',         label:'🏥 स्वास्थ्य कारण (Health Issue)'},
  {v:'family',         label:'👨‍👩‍👧 पारिवारिक कारण (Family Reason)'},
  {v:'education',      label:'📚 पढ़ाई / Higher Education'},
  {v:'relocation',     label:'🚚 शहर बदलना (Relocation)'},
  {v:'salary',         label:'💰 वेतन असंतोष (Salary Issue)'},
  {v:'work_environment',label:'🏭 कार्य वातावरण (Work Environment)'},
  {v:'terminated',     label:'⚠️ सेवा समाप्ति (Terminated by Company)'},
  {v:'absconding',     label:'🚫 बिना सूचना गया (Absconding)'},
  {v:'other',          label:'📋 अन्य कारण (Other)'},
];

function openResignationForm(){
  const emps = getEmps().filter(e=>e.status!=='resigned');
  const me = myEmp();
  const canSelectAny = isAdmin() || isMgr();
  
  const empOptions = canSelectAny
    ? emps.map(e=>`<option value="${e.id}">${e.name} (${e.empId||'—'} · ${secName(e.sec)})</option>`).join('')
    : `<option value="${me?.id||''}">${me?.name||SESSION.name}</option>`;
  
  const reasonOptions = RESIGN_REASONS.map(r=>`<option value="${r.v}">${r.label}</option>`).join('');
  
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;margin-bottom:14px">
    <div style="font-size:40px;margin-bottom:6px">📝</div>
    <div class="modal-title" style="margin-bottom:4px">Resignation / त्यागपत्र</div>
    <div style="font-size:14px;color:var(--lv);font-weight:700">⚠️ यह कार्रवाई अपरिवर्तनीय है</div>
  </div>
  
  <div class="field"><label>कर्मचारी का नाम</label>
    <select id="res_emp">${empOptions}</select></div>
  
  <div class="field"><label>Resignation का कारण</label>
    <select id="res_reason">${reasonOptions}</select></div>
  
  <div class="field"><label>अंतिम कार्य दिवस (Last Working Day)</label>
    <input type="date" id="res_lastday" value="${addDays(TODAY_STR,30)}"></div>
  
  <div class="field"><label>विवरण / टिप्पणी (Optional)</label>
    <textarea id="res_notes" placeholder="कोई अतिरिक्त जानकारी..."></textarea></div>
  
  <div class="field">
    <label>📸 Offer Letter / Resignation Letter Upload करें (Optional)</label>
    <div id="res_img_preview" style="display:none;margin-bottom:8px;border-radius:10px;overflow:hidden;max-height:200px;position:relative">
      <img id="res_img_thumb" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px" src="">
      <button onclick="clearResignImg()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.7);border:none;color:#fff;border-radius:50%;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    <label for="res_img_input" style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1.5px dashed rgba(255,255,255,.2);border-radius:10px;padding:14px;cursor:pointer;color:var(--muted2);font-size:14px;font-weight:600">
      📷 Photo चुनें या यहाँ tap करें
      <input type="file" id="res_img_input" accept="image/*" style="display:none" onchange="previewResignImg(this)">
    </label>
  </div>
  
  <button class="submit-btn" style="background:linear-gradient(135deg,var(--lv),#9f1239);box-shadow:0 4px 20px rgba(244,63,94,.3)" onclick="submitResignation()">
    📤 Resignation भेजें
  </button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

function previewResignImg(input){
  const file = input.files[0]; if(!file) return;
  if(file.size > 10*1024*1024){ toast(L('⚠️ फोटो 10MB से छोटी होनी चाहिए','⚠️ Photo must be under 10MB')); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('res_img_thumb').src = e.target.result;
    document.getElementById('res_img_preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}
function clearResignImg(){
  document.getElementById('res_img_thumb').src='';
  document.getElementById('res_img_preview').style.display='none';
  document.getElementById('res_img_input').value='';
}

async function submitResignation(){
  const empId = document.getElementById('res_emp').value;
  const reason = document.getElementById('res_reason').value;
  const lastDay = document.getElementById('res_lastday').value;
  const notes = document.getElementById('res_notes').value;
  
  if(!empId){ toast(L('कर्मचारी चुनें','Select employee')); return; }
  if(!reason){ toast(L('कारण चुनें','Select reason')); return; }
  if(!lastDay){ toast(L('अंतिम दिन चुनें','Select last day')); return; }
  
  const emp = getEmps().find(e=>e.id===empId);
  if(!emp){ toast(L('कर्मचारी नहीं मिला','Employee not found')); return; }
  
  // Check duplicate — block if pending or already approved
  try{
    const existingRes = await fbGet('resignations');
    if(existingRes){
      const dup = Object.values(existingRes).find(r=>
        (r.empId===empId || r.empObjId===empId || r.empCode===emp.empId) && 
        (r.status==='pending' || r.status==='approved')
      );
      if(dup){
        const msg = dup.status==='pending' ? '⚠️ इस कर्मचारी का resignation पहले से pending है' : '⚠️ इस कर्मचारी का resignation पहले से approved है';
        toast(msg); return;
      }
    }
  }catch(e){ console.warn('[resignation] duplicate check:', e.message); }
  
  // Get image
  let imgData = null;
  const imgInput = document.getElementById('res_img_input');
  if(imgInput && imgInput.files && imgInput.files[0]){
    imgData = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(imgInput.files[0]);
    });
    try{ imgData = await compressImage(imgData, 800, 0.6); }catch(e){}
  }
  
  const reasonLabel = RESIGN_REASONS.find(r=>r.v===reason)?.label || reason;
  
  const resObj = {
    empId: empId,
    empObjId: emp.id,
    empName: emp.name,
    empCode: emp.empId,
    section: emp.sec,
    designation: emp.designation || '',
    reason: reason,
    reasonLabel: reasonLabel,
    lastWorkingDay: lastDay,
    notes: notes || '',
    status: 'pending',
    submittedBy: SESSION.name,
    submittedById: SESSION.empObjId || 'admin',
    submittedAt: new Date().toISOString()
  };
  if(imgData) resObj.photo = imgData;
  
  try{
    const key = await fbPush('resignations', resObj);
    await fbUpdate('resignations/'+key, {_key:key});
    closeModal();
    toast(L('📝 Resignation request भेज दी गई!','📝 Resignation request submitted!'));
    try{ await notifyAdmin('📝 Resignation Request', emp.name+' ('+emp.empId+') ने resignation भेजा — '+reasonLabel); }catch(e){}
    renderResignations();
  }catch(e){
    toast('❌ Error: '+e.message);
  }
}

function renderResignations(){
  const el = document.getElementById('resignList');
  if(!el) return;
  
  fbGet('resignations').then(data => {
    let list = data ? Object.values(data) : [];
    if(!isAdmin() && !isMgr()) list = list.filter(r=>r.empId===SESSION.empObjId || r.submittedById===SESSION.empObjId);
    // Leave-tab status chips no longer control resignation list (list lives on Reports)
    list.sort((a,b) => new Date(b.submittedAt||0) - new Date(a.submittedAt||0));
    
    if(!list.length){ el.innerHTML=''; return; }
    
    el.innerHTML = `<div class="stitle" style="margin-top:14px">📝 Resignation Requests</div>` + list.map(r => {
      const secInfo = SEC[r.section] || SEC.M1;
      const statusMap = {pending:L('⏳ प्रतीक्षा','⏳ Pending'),approved:L('✅ स्वीकार','✅ Accepted'),rejected:L('❌ अस्वीकार','❌ Rejected')};
      const statusColor = {pending:'var(--day)',approved:'var(--green)',rejected:'var(--lv)'}[r.status]||'var(--muted)';
      const fmtLwd = r.lastWorkingDay ? new Date(r.lastWorkingDay).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'}) : '—';
      
      return `<div class="card" style="border-left:3px solid var(--lv)">
        <div class="card-row">
          <div class="card-ico" style="background:var(--lvbg)">📝</div>
          <div class="card-body">
            <div class="card-name" style="color:var(--lv)">${escHtml(r.empName)}</div>
            <div style="font-size:14px;color:var(--muted2);margin-top:2px">${escHtml(r.empCode||'')} · ${(typeof secName==='function'?secName(r.section):null)||secInfo.label||secInfo.hi||''} · ${escHtml(r.designation||'')}</div>
            <div class="card-tags" style="margin-top:6px">
              <span class="badge ${r.section}">${(typeof secName==='function'?secName(r.section):null)||secInfo.label||secInfo.hi||''}</span>
              <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:5px;font-size:13px;font-weight:700;background:var(--lvbg);color:var(--lv)">RESIGNATION</span>
              <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:5px;font-size:13px;font-weight:700;color:${statusColor}">${statusMap[r.status]||r.status}</span>
            </div>
            <div style="margin-top:8px;background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.18);border-radius:8px;padding:10px">
              <div style="font-size:12px;font-weight:800;color:var(--lv);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">📋 कारण</div>
              <div style="font-size:14px;color:var(--text)">${escHtml(r.reasonLabel||r.reason)}</div>
              ${r.notes ? `<div style="font-size:13px;color:var(--muted2);margin-top:4px">${escHtml(r.notes)}</div>` : ''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:13px;color:var(--muted2)">
              <span>📅 Last Day: <b style="color:#fff">${fmtLwd}</b></span>
              <span>📝 By: ${escHtml(r.submittedBy||'')}</span>
              <span>${new Date(r.submittedAt).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'})}</span>
            </div>
            ${r.photo ? `<div style="margin-top:8px;border-radius:10px;overflow:hidden;cursor:pointer" onclick="viewResignPhoto(this)">
              <img src="${r.photo}" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;display:block">
            </div>` : ''}
          </div>
        </div>
        ${(isAdmin()||isMgr()) && r.status==='pending' ? `<div class="action-row" style="margin-top:10px;display:flex;gap:8px">
          <button class="act-btn approve" onclick="approveResignation('${r._key}')">✅ Accept करें</button>
          <button class="act-btn reject" onclick="rejectResignation('${r._key}')">❌ Reject करें</button>
        </div>` : ''}
        ${r.status==='approved' ? `<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:8px;padding:10px;margin-top:8px">
          <div style="font-size:14px;color:var(--green);font-weight:700">✅ Resignation approved — शेड्यूल से हटाया गया</div>
          ${r.relievingDate ? `<div style="font-size:13px;color:var(--muted2);margin-top:4px">📅 Relieving Date: <b style="color:#fff">${new Date(r.relievingDate).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'})}</b></div>` : ''}
          ${r.managerRemark ? `<div style="font-size:13px;color:var(--muted2);margin-top:4px">📝 Remark: <b style="color:#fff">${escHtml(r.managerRemark)}</b></div>` : ''}
          ${r.approvedBy ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">By: ${escHtml(r.approvedBy)}</div>` : ''}
        </div>` : ''}
      </div>`;
    }).join('');
  }).catch(()=>{ el.innerHTML=''; });
}

function viewResignPhoto(el){
  const img = el.querySelector('img'); if(!img) return;
  openModal(`<div class="modal-handle"></div>
    <div style="text-align:center;padding:10px 0">
      <img src="${img.src}" style="width:100%;border-radius:10px;max-height:70vh;object-fit:contain">
    </div>
    <button class="cancel-btn" onclick="closeModal()">बंद करें</button>`);
}

const RELIEVING_CHECKLIST = [
  {id:'id_card',       icon:'🪪', label:'ID Card / Access Card वापस लिया',       sub:'Company ID card, gate pass'},
  {id:'uniform',       icon:'👔', label:'Uniform / PPE वापस लिया',              sub:'Safety shoes, helmet, gloves, uniform'},
  {id:'tools',         icon:'🔧', label:'Tools / Equipment वापस लिए',           sub:'Company tools, keys, instruments'},
  {id:'locker',        icon:'🗄️', label:'Locker खाली करवाया',                   sub:'Personal locker cleared'},
  {id:'handover',      icon:'📋', label:'Work Handover पूरा हुआ',               sub:'Shift duties, pending tasks handed over'},
  {id:'documents',     icon:'📄', label:'Documents जमा किए / दिए',              sub:'Experience letter, salary slip, form 16'},
  {id:'salary_clear',  icon:'💰', label:'Salary / Dues Clear',                  sub:'Pending salary, overtime, bonus settled'},
  {id:'notice_served', icon:'📅', label:'Notice Period पूरा किया',               sub:'30 days notice or notice pay adjusted'},
  {id:'no_damage',     icon:'✅', label:'Company Property में कोई नुकसान नहीं',  sub:'No damage to machines, tools, property'},
  {id:'exit_interview', icon:'🗣️', label:'Exit Interview / Feedback लिया',       sub:'Final feedback taken from employee'},
];

async function approveResignation(key){
  try{
    const res = await fbGet('resignations/'+key);
    if(!res){ toast(L('❌ Record नहीं मिला','❌ Record not found')); return; }
    
    const reasonLabel = res.reasonLabel || res.reason || '';
    const fmtLwd = res.lastWorkingDay ? new Date(res.lastWorkingDay).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'}) : '—';
    
    const checklistHtml = RELIEVING_CHECKLIST.map(c => `
      <label style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--card);
        border:1.5px solid var(--border2);border-radius:12px;margin-bottom:8px;cursor:pointer;
        transition:all .15s" onclick="this.style.borderColor=this.querySelector('input').checked?'rgba(34,197,94,.5)':'var(--border2)';this.style.background=this.querySelector('input').checked?'rgba(34,197,94,.06)':'var(--card)';_checkRelievingProgress()">
        <input type="checkbox" id="rlv_${c.id}" value="${c.id}" 
          style="width:24px;height:24px;min-width:24px;accent-color:var(--green);cursor:pointer;margin-top:2px"
          onchange="this.parentElement.style.borderColor=this.checked?'rgba(34,197,94,.5)':'var(--border2)';this.parentElement.style.background=this.checked?'rgba(34,197,94,.06)':'var(--card)';_checkRelievingProgress()">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:800;color:#fff">${c.icon} ${c.label}</div>
          <div style="font-size:13px;color:var(--muted2);margin-top:2px">${c.sub}</div>
        </div>
      </label>`).join('');
    
    openModal(`<div class="modal-handle"></div>
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:36px;margin-bottom:6px">📋</div>
        <div class="modal-title" style="margin-bottom:4px">Relieving Checklist</div>
        <div style="font-size:14px;color:var(--muted2)">Approve करने से पहले verify करें</div>
      </div>
      
      <div style="background:var(--panel);border:1px solid rgba(244,63,94,.3);border-radius:14px;padding:14px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:28px">👤</div>
          <div>
            <div style="font-size:18px;font-weight:900;color:var(--lv)">${escHtml(res.empName)}</div>
            <div style="font-size:13px;color:var(--muted2)">${escHtml(res.empCode||'')} · ${escHtml(reasonLabel)}</div>
            <div style="font-size:13px;color:var(--muted2)">Last Day: <b style="color:#fff">${fmtLwd}</b></div>
          </div>
        </div>
      </div>
      
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:15px;font-weight:800;color:#fff">✅ Checklist Items</div>
        <div id="rlvProgress" style="font-size:14px;font-weight:900;color:var(--muted)">0/${RELIEVING_CHECKLIST.length}</div>
      </div>
      
      <div style="background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:14px;margin-bottom:12px">
        <div class="field" style="margin-bottom:10px">
          <label style="color:var(--green);font-weight:800">📅 Relieving Date (बदल सकते हैं)</label>
          <input type="date" id="rlv_relieve_date" value="${res.lastWorkingDay||TODAY_STR}" style="width:100%;padding:14px;background:var(--card);border:2px solid rgba(34,197,94,.3);border-radius:10px;color:#fff;font-size:18px;outline:none">
        </div>
        <div class="field" style="margin-bottom:0">
          <label style="color:var(--green);font-weight:800">📝 Manager Remark</label>
          <select id="rlv_remark" onchange="if(this.value==='custom')document.getElementById('rlv_remark_custom').style.display='block'" style="width:100%;padding:14px;background:var(--card);border:2px solid rgba(34,197,94,.3);border-radius:10px;color:#fff;font-size:16px;outline:none;appearance:none">
            <option value="Relieved as per Policy">✅ Relieved as per Policy</option>
            <option value="Relieved with immediate effect">⚡ Relieved with immediate effect</option>
            <option value="Relieved — Notice period waived">📋 Relieved — Notice period waived</option>
            <option value="Relieved — Notice period served">📅 Relieved — Notice period served</option>
            <option value="Terminated as per company policy">⚠️ Terminated as per company policy</option>
            <option value="Absconding — No dues cleared">🚫 Absconding — No dues cleared</option>
            <option value="custom">✏️ Custom remark लिखें...</option>
          </select>
          <textarea id="rlv_remark_custom" style="display:none;width:100%;margin-top:8px;padding:12px;background:var(--card);border:2px solid var(--border2);border-radius:10px;color:#fff;font-size:15px;outline:none;resize:none;height:70px;font-family:inherit" placeholder="अपना remark लिखें..."></textarea>
        </div>
      </div>
      
      <div style="max-height:45vh;overflow-y:auto;margin-bottom:14px">
        ${checklistHtml}
      </div>
      
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="rlv_select_all" onchange="_toggleAllRelieving(this.checked)" 
            style="width:20px;height:20px;accent-color:var(--m1);cursor:pointer">
          <span style="font-size:14px;font-weight:700;color:var(--m1)">सब Select करें</span>
        </label>
      </div>
      
      <div id="rlvNote" style="display:none;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.3);border-radius:10px;padding:10px;margin-bottom:10px;font-size:13px;color:var(--day);text-align:center">
        ⚠️ कुछ items unchecked हैं — फिर भी approve कर सकते हैं
      </div>
      
      <button id="rlvApproveBtn" class="submit-btn" style="background:linear-gradient(135deg,var(--green),#15803d);box-shadow:0 4px 20px rgba(34,197,94,.3);opacity:.4;pointer-events:none" onclick="confirmRelievingApproval('${key}')">
        ✅ Approve & Remove from Schedule
      </button>
      <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
  }catch(e){
    toast('❌ Error: '+e.message);
  }
}

function _checkRelievingProgress(){
  const total = RELIEVING_CHECKLIST.length;
  const checked = RELIEVING_CHECKLIST.filter(c=>document.getElementById('rlv_'+c.id)?.checked).length;
  const progEl = document.getElementById('rlvProgress');
  const btn = document.getElementById('rlvApproveBtn');
  const note = document.getElementById('rlvNote');
  
  if(progEl){
    progEl.textContent = checked+'/'+total;
    progEl.style.color = checked===total ? 'var(--green)' : checked>0 ? 'var(--day)' : 'var(--muted)';
  }
  
  if(btn){
    if(checked >= 3){
      btn.style.opacity='1'; btn.style.pointerEvents='auto';
    } else {
      btn.style.opacity='.4'; btn.style.pointerEvents='none';
    }
  }
  
  if(note){
    note.style.display = (checked >= 3 && checked < total) ? 'block' : 'none';
  }
}

function _toggleAllRelieving(checked){
  RELIEVING_CHECKLIST.forEach(c => {
    const cb = document.getElementById('rlv_'+c.id);
    if(cb){
      cb.checked = checked;
      cb.parentElement.style.borderColor = checked ? 'rgba(34,197,94,.5)' : 'var(--border2)';
      cb.parentElement.style.background = checked ? 'rgba(34,197,94,.06)' : 'var(--card)';
    }
  });
  _checkRelievingProgress();
}

async function confirmRelievingApproval(key){
  const checkedItems = RELIEVING_CHECKLIST.filter(c=>document.getElementById('rlv_'+c.id)?.checked).map(c=>c.id);
  const uncheckedItems = RELIEVING_CHECKLIST.filter(c=>!document.getElementById('rlv_'+c.id)?.checked).map(c=>c.label);
  
  // Get editable relieving date and remark
  const relieveDate = document.getElementById('rlv_relieve_date')?.value || TODAY_STR;
  const remarkSelect = document.getElementById('rlv_remark')?.value || '';
  const remarkCustom = document.getElementById('rlv_remark_custom')?.value || '';
  const remark = remarkSelect === 'custom' ? remarkCustom : remarkSelect;
  
  if(uncheckedItems.length > 0){
    const list = uncheckedItems.map(u=>`• ${u}`).join('<br>');
    const ok = await confirmModal(
      `${uncheckedItems.length} Items Incomplete हैं`,
      `नीचे दिए items अभी complete नहीं हैं:<br><br><span style="font-size:12px;color:var(--lv)">${list}</span><br><br>फिर भी Approve करें?`,
      '✅ हाँ, Approve करें',
      '← वापस जाएं'
    );
    if(!ok) return;
  }
  
  try{
    const res = await fbGet('resignations/'+key);
    if(!res){ toast(L('❌ Record नहीं मिला','❌ Record not found')); return; }
    
    // 1. Update resignation with checklist + remark + relieving date
    await fbUpdate('resignations/'+key, {
      status:'approved',
      approvedBy: SESSION.name,
      approvedAt: new Date().toISOString(),
      relievingDate: relieveDate,
      managerRemark: remark,
      relievingChecklist: checkedItems,
      relievingPending: uncheckedItems.length > 0 ? uncheckedItems : null
    });
    
    // 2. Mark employee as resigned
    const emp = getEmps().find(e=>e.id===res.empId);
    if(emp){
      await fbUpdate('employees/'+emp.id, { status:'resigned' });
    }
    
    // 3. Add to left employees
    const leftRecord = {
      id: 'left_'+res.empCode,
      empId: res.empCode,
      name: res.empName,
      designation: res.designation || '',
      phone: '',
      mc: emp?.mc || '',
      sec: res.section,
      joiningDate: emp?.joiningDate || '',
      leftAt: new Date(relieveDate || Date.now()).toISOString(),
      leftReason: res.reason === 'terminated' ? 'terminated' : 'resigned',
      leftStatusNote: remark || ((res.reasonLabel||res.reason) + ' — ' + new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})),
      replacedBy: '',
      approvedBy: SESSION.name,
      relievingChecklist: checkedItems,
      managerRemark: remark
    };
    await fbSet('leftEmployees/left_'+res.empCode, leftRecord);
    
    // 4. Notify employee
    try{
      await pushShiftNotification(res.empId, res.empName, relieveDate||TODAY_STR, '', 'RESIGNED', SESSION.name);
    }catch(e){}
    
    closeModal();
    toast(L('✅ Resignation approved — ','✅ Resignation approved — ')+res.empName+L(' शेड्यूल से हटाया गया',' removed from schedule'));
    renderResignations();
    renderAll();
  }catch(e){
    toast('❌ Error: '+e.message);
  }
}

async function rejectResignation(key){
  const ok = await confirmModal('Resignation Reject करें?', 'क्या आप यह Resignation REJECT करना चाहते हैं?', '❌ हाँ, Reject करें', 'वापस जाएं');
  if(!ok) return;
  try{
    await fbUpdate('resignations/'+key, {
      status:'rejected',
      rejectedBy: SESSION.name,
      rejectedAt: new Date().toISOString()
    });
    toast('❌ Resignation rejected');
    renderResignations();
  }catch(e){
    toast('❌ Error: '+e.message);
  }
}

// ════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════
let _rfFilter='imp_info';
function setRF(f,el){ _rfFilter=f; document.querySelectorAll('#reportFilter .chip').forEach(c=>c.classList.remove('on')); el.classList.add('on'); renderReports(); }

function _buildNcrCards(){
  // Convert hardcoded NCR_DATA into report-like objects for display
  return NCR_DATA.map(n=>{
    // Resolve names to emp objects for section info
    const involvedIds = n.names.map(nm=>NCR_NAME_MAP[nm]).filter(Boolean);
    const firstEmp = getEmps().find(e=>involvedIds.includes(e.id));
    const section = firstEmp?.sec || 'M1';
    const displayNames = n.names.filter(nm=>NCR_NAME_MAP[nm]).join(', ') || n.names.join(', ') || '—';
    return {
      _key: 'ncr_'+n.ncr,
      _isLegacy: true,
      type: 'ncr',
      status: 'approved',
      date: n.date,
      aboutName: displayNames,
      empName: displayNames,
      section: section,
      description: n.reason,
      reportedByName: 'Quality Dept',
      ncrNum: n.ncr,
      involvedNames: n.names,
    };
  });
}

function renderReports(){
  // ── OD Records — separate rendering ──
  if(_rfFilter === 'od'){
    renderODRecords();
    return;
  }

  // Merge Firebase reports + hardcoded NCR_DATA
  let fbList = getReports();
  if(!isAdmin()) fbList = fbList.filter(r=>r.status==='approved'||r.reportedById===SESSION.empObjId);

  // Build legacy NCR cards — only for legacy viewers (Admin / old employee-code roles).
  // New self-registered Manager/Member accounts should never see this hardcoded historical data.
  // Legacy hardcoded NCR demo data — removed entirely, no longer shown to anyone
  const legacyNcrs = [];

  // Combine: Firebase reports first, then legacy NCRs (avoid duplicates by NCR number)
  const fbNcrNums = new Set(fbList.filter(r=>r.type==='ncr'&&r.ncrNum).map(r=>String(r.ncrNum)));
  const filteredLegacy = legacyNcrs.filter(n=>!fbNcrNums.has(String(n.ncrNum)));

  let list = [...fbList, ...filteredLegacy];

  if(_rfFilter!=='all'){
    if(_rfFilter==='warning') list = list.filter(r=>r.type==='warning'||r.type==='indiscipline');
    else list = list.filter(r=>r.type===_rfFilter);
  }
  list.sort((a,b)=>{
    const da=new Date(a.date), db=new Date(b.date);
    return db-da;
  });

  // Update count badge (context-aware for Imp Info filter)
  const badge = document.getElementById('reportTotalBadge');
  if(badge){
    const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
    if(_rfFilter === 'imp_info'){
      badge.textContent = isEn ? `${list.length} notice(s)` : `कुल ${list.length} सूचना`;
      badge.style.color = '#38bdf8';
    } else {
      const ncrCount = list.filter(r=>r.type==='ncr').length;
      badge.textContent = isEn ? `${list.length} reports · ${ncrCount} NCR` : `कुल ${list.length} रिपोर्ट · ${ncrCount} NCR`;
      badge.style.color = '#f87171';
    }
  }

  const rt_ncr = REPORT_TYPES.ncr;

  document.getElementById('reportList').innerHTML = list.length ? list.map(r=>{
    const rt=REPORT_TYPES[r.type]||rt_ncr;
    const isNCR = r.type==='ncr';
    const isLegacy = r._isLegacy;
    const ncrLabel = isNCR && r.ncrNum ? `<span style="background:rgba(244,63,94,.2);color:var(--lv);font-size:10px;font-weight:900;padding:2px 8px;border-radius:5px;flex-shrink:0">NCR #${r.ncrNum}</span>` : '';

    // For legacy NCRs show all involved names prominently
    const nameDisplay = isLegacy && r.involvedNames?.length > 1
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${r.involvedNames.map(nm=>`<span style="background:rgba(244,63,94,.12);color:var(--lv);border:1px solid rgba(244,63,94,.25);border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700">${nm}</span>`).join('')}
        </div>`
      : `<div class="card-name" style="color:#fff;font-size:15px">${typeof escHtml==='function'?escHtml(r.title||r.aboutName||r.empName||''):(r.title||r.aboutName||r.empName||'')}</div>`;

    return `<div class="card" style="border-left:3px solid ${rt.color}${isLegacy?';border-left-width:4px':''}">
      <div class="card-row">
        <div class="card-ico" style="background:${rt.bg}">${rt.ico}</div>
        <div class="card-body">
          ${nameDisplay}
          <div class="card-tags" style="margin-top:5px;gap:5px">
            <span class="badge ${r.section||'M1'}">${secName(r.section)||'—'}</span>
            <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;background:${rt.bg};color:${rt.color}">${rt.label}</span>
            ${ncrLabel}
            ${!isLegacy?`<span class="badge ${r.status}">${{pending:'⏳ प्रतीक्षा',approved:'✅ मंजूर',rejected:'❌ अस्वीकार'}[r.status]||r.status}</span>`:'<span class="badge approved">✅ दर्ज</span>'}
          </div>
          <div style="margin-top:8px;background:${r.type==='imp_info'?'rgba(56,189,248,.08)':'rgba(244,63,94,.05)'};border:1px solid ${r.type==='imp_info'?'rgba(56,189,248,.25)':'rgba(244,63,94,.18)'};border-radius:8px;padding:10px">
            <div style="font-size:10px;font-weight:800;color:${r.type==='imp_info'?'#38bdf8':'var(--lv)'};text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">${r.type==='imp_info'?'📢 सूचना':(isNCR?'⚠️ NCR विवरण':'विवरण')}</div>
            <div style="font-size:13px;color:var(--text);line-height:1.6">${(typeof escHtml==='function'?escHtml(r.description||'—'):(r.description||'—'))}</div>
          </div>
          <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <span style="font-size:11px;color:var(--muted2)">📅 ${fmtDate(r.date)}</span>
            <span style="font-size:11px;color:var(--muted2)">📝 ${r.reportedByName||'Quality Dept'}</span>
          </div>
          ${(r.photoUrl||r.photo) ? `<div class="rpt-photo-wrap" style="margin-top:10px;border-radius:12px;overflow:hidden;cursor:pointer;border:1px solid var(--border2);background:rgba(0,0,0,.15)" onclick="viewReportPhoto(this)">
            <img class="rpt-photo" src="${r.photoUrl||r.photo}" alt="Report photo" style="width:100%;height:auto;max-height:none;object-fit:contain;display:block;border-radius:12px" loading="lazy">
          </div>` : ''}
        </div>
      </div>
      ${(isAdmin()||canManageReports())&&!isLegacy&&r.status==='pending'?`<div class="action-row">
        <button class="act-btn approve" onclick="actReport('${r._key}','approved')">✅ मंजूर</button>
        <button class="act-btn reject"  onclick="actReport('${r._key}','rejected')">❌ अस्वीकार</button>
      </div>`:''}
      ${isAdminOrMgr()&&!isLegacy&&r._key?`<div style="margin-top:8px;text-align:right">
        <button onclick="deleteReport('${r._key}','${(r.empName||r.aboutName||'').replace(/'/g,"\\'")}')"
          style="background:none;border:1px solid rgba(244,63,94,.3);border-radius:8px;padding:6px 14px;
          color:var(--lv);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          🗑️ Delete
        </button>
      </div>`:''}
    </div>`;
  }).join('') : (function(){
    const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
    if(_rfFilter === 'imp_info'){
      return `<div class="empty" style="padding:28px 16px">
        <div class="empty-icon">📢</div>
        <div class="empty-text">${L('कोई महत्वपूर्ण सूचना नहीं','No important notices yet')}</div>
        <div style="font-size:12px;color:var(--muted2);margin-top:8px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">
          ${L('कोई भी टीम सूचना पोस्ट कर सकता है — फोटो वैकल्पिक।','Anyone can post a team notice with optional photo.')}
        </div>
        <button type="button" onclick="openImpInfoForm()" class="action-primary" style="margin-top:16px;display:inline-flex">📢 ${L('सूचना पोस्ट करें','Post notice')}</button>
      </div>`;
    }
    return '<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">'+(L('कोई रिपोर्ट नहीं','No reports'))+'</div></div>';
  })();
}

async function renderODRecords(){
  // Only Admin/Manager can view all OD records
  if(!isAdminOrMgr()){
    document.getElementById('reportList').innerHTML = '<div class="empty"><div class="empty-icon">🔒</div><div class="empty-text">OD रिकॉर्ड केवल Manager/Admin देख सकते हैं</div></div>';
    return;
  }
  const el = document.getElementById('reportList');
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted2)">⏳ OD रिकॉर्ड लोड हो रहे हैं...</div>';

  try{
    // Read from reports with type:'od' — no Firebase permission error for Manager
    const allReports = await fbGet('reports');
    if(!allReports){
      el.innerHTML = '<div class="empty"><div class="empty-icon">🔄</div><div class="empty-text">कोई OD रिकॉर्ड नहीं</div></div>';
      return;
    }
    const records = Object.values(allReports).filter(r => r.type === 'od');

    if(!records.length){
      el.innerHTML = '<div class="empty"><div class="empty-icon">🔄</div><div class="empty-text">कोई OD रिकॉर्ड नहीं</div></div>';
      return;
    }

    // Group by employee
    const byEmp = {};
    records.forEach(r=>{
      const key = r.empId || r.empName || 'Unknown';
      if(!byEmp[key]) byEmp[key] = { name: r.empName||'—', records:[] };
      byEmp[key].records.push(r);
    });

    // Sort each employee's records by date (newest first)
    Object.values(byEmp).forEach(g=>g.records.sort((a,b)=>new Date(b.date)-new Date(a.date)));

    let html = `<div style="margin-bottom:12px;background:rgba(13,148,136,.08);border:1px solid rgba(13,148,136,.25);border-radius:12px;padding:12px;font-size:12px;color:var(--muted2)">
      🔄 <b style="color:#0d9488">कुल ${records.length} OD</b> · ${Object.keys(byEmp).length} कर्मचारी
    </div>`;

    Object.entries(byEmp).sort((a,b)=>b[1].records.length-a[1].records.length).forEach(([empId, group])=>{
      const count = group.records.length;
      const emp = getEmps().find(e=>e.id===empId);
      const mc = emp?.mc || emp?.sec || '—';

      html += `<div class="card" style="border-left:3px solid #0d9488;margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:9px;background:rgba(13,148,136,.15);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#0d9488">OD</div>
            <div>
              <div style="font-size:15px;font-weight:800;color:#fff">${escHtml(group.name)}</div>
              <div style="font-size:11px;color:var(--muted2)">${mc} · ${emp?.empId||''}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:#0d9488">${count}</div>
            <div style="font-size:9px;color:var(--muted);font-weight:700">ODs ▼</div>
          </div>
        </div>
        <div style="display:none">
          ${group.records.map(r=>`
            <div style="display:flex;gap:10px;padding:8px 0;border-top:1px solid var(--border);align-items:flex-start">
              <div style="min-width:70px">
                <div style="font-size:11px;font-weight:700;color:#fff">${new Date(r.date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'})}</div>
                <div style="font-size:9px;color:var(--muted)">${new Date(r.date).toLocaleDateString('en',{weekday:'short'})}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:800;color:#0d9488">→ ${escHtml(r.toDept||'—')}</div>
                ${r.reason?`<div style="font-size:11px;color:var(--muted2);margin-top:2px">${escHtml(r.reason)}</div>`:''}
              </div>
              <div style="font-size:9px;color:var(--muted);text-align:right;white-space:nowrap">by ${escHtml(r.markedBy||'—')}</div>
            </div>`).join('')}
        </div>
      </div>`;
    });

    el.innerHTML = html;
  }catch(e){
    el.innerHTML = '<div style="color:var(--lv);padding:12px">❌ Error: '+e.message+'</div>';
  }
}

function openReportForm(){
  const emps=getEmps();
  const empOptions=emps.map(e=>`<option value="${e.id}|${e.name}|${e.sec}">${e.name} (${secName(e.sec)})</option>`).join('');

  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">📋 रिपोर्ट दर्ज करें</div>
  <div class="field"><label>रिपोर्ट किसके बारे में</label>
    <select id="rpt_about">${empOptions}</select></div>
  <div class="field"><label>रिपोर्ट का प्रकार</label>
    <select id="rpt_type">
      <option value="ncr">⚠️ NCR रिपोर्ट</option>
      <option value="absent">📵 अनुपस्थिति</option>
      <option value="warning">⚡ चेतावनी / अनुशासनहीनता</option>
      <option value="appreciation">🌟 प्रशंसा / तारीफ</option>
    </select></div>
  <div class="field"><label>तारीख</label><input type="date" id="rpt_date" value="${TODAY_STR}"></div>
  <div class="field"><label>विवरण (Details)</label>
    <textarea id="rpt_desc" placeholder="पूरी जानकारी लिखें... (मशीन नंबर, क्या हुआ, कब हुआ)"></textarea></div>
  <div class="field">
    <label>📸 फोटो अपलोड करें (Optional, max 10MB)</label>
    <div id="rpt_img_preview" style="display:none;margin-bottom:8px;border-radius:10px;overflow:hidden;max-height:200px;position:relative">
      <img id="rpt_img_thumb" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px" src="">
      <button onclick="clearReportImg()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.7);border:none;color:#fff;border-radius:50%;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    <div style="display:flex;gap:6px">
      <button type="button" onclick="document.getElementById('rpt_cam_input').click()"
        style="flex:1;padding:12px;border:1.5px dashed rgba(255,255,255,.2);border-radius:10px;
        background:rgba(255,255,255,.06);color:var(--muted2);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        📸 Camera से लें
      </button>
      <button type="button" onclick="document.getElementById('rpt_img_input').click()"
        style="flex:1;padding:12px;border:1.5px dashed rgba(255,255,255,.2);border-radius:10px;
        background:rgba(255,255,255,.06);color:var(--muted2);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        🖼️ Gallery से चुनें
      </button>
    </div>
    <input type="file" id="rpt_cam_input" accept="image/*" capture="environment" style="display:none" onchange="previewReportImg(this)">
    <input type="file" id="rpt_img_input" accept="image/*" style="display:none" onchange="previewReportImg(this)">
    <div id="rpt_img_size_err" style="color:#f43f5e;font-size:11px;margin-top:4px;display:none">⚠️ फोटो 10MB से छोटी होनी चाहिए</div>
  </div>
  <button class="submit-btn" onclick="submitReport()">📤 रिपोर्ट भेजें</button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

function previewReportImg(input){
  const file = input.files[0];
  if(!file) return;
  const errEl = document.getElementById('rpt_img_size_err');
  if(file.size > 10*1024*1024){ errEl.style.display='block'; input.value=''; return; }
  errEl.style.display='none';
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('rpt_img_thumb').src = e.target.result;
    document.getElementById('rpt_img_preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}
function clearReportImg(){
  document.getElementById('rpt_img_thumb').src='';
  document.getElementById('rpt_img_preview').style.display='none';
  const gi = document.getElementById('rpt_img_input'); if(gi) gi.value='';
  const ci = document.getElementById('rpt_cam_input'); if(ci) ci.value='';
}
async function getReportImgBase64(){
  const input = document.getElementById('rpt_img_input');
  const camInput = document.getElementById('rpt_cam_input');
  const activeInput = (camInput && camInput.files && camInput.files[0]) ? camInput : (input && input.files && input.files[0]) ? input : null;
  if(!activeInput) return null;
  return new Promise(res=>{
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.readAsDataURL(activeInput.files[0]);
  });
}
let _reportSubmitting = false;
async function submitReport(){
  if(_reportSubmitting) return;
  _reportSubmitting = true;
  const submitBtn = document.querySelector('.modal button[onclick*="submitReport"]');
  if(submitBtn){ submitBtn.disabled=true; submitBtn.style.opacity='.6'; submitBtn.textContent='⏳ भेज रहे हैं...'; }
  try{
    const aboutVal=document.getElementById('rpt_about').value;
    const [aboutId,aboutName,aboutSec]=aboutVal.split('|');
    const type=document.getElementById('rpt_type').value;
    const date=document.getElementById('rpt_date').value;
    const desc=document.getElementById('rpt_desc').value;
    if(!aboutId||!desc){ toast(L('सभी जानकारी भरें','Fill in all details')); _reportSubmitting=false; if(submitBtn){submitBtn.disabled=false;submitBtn.style.opacity='1';submitBtn.textContent='📤 रिपोर्ट भेजें';} return; }
    const me=myEmp();
    let imgData = await getReportImgBase64().catch(()=>null);
    if(imgData){
      try{ imgData = await compressImage(imgData, 800, 0.6); }catch(e){}
      if(imgData.length > 500000){ toast(L('⚠️ फोटो बहुत बड़ी है — कृपया छोटी फोटो लें','⚠️ Photo too large — please use a smaller one')); _reportSubmitting=false; if(submitBtn){submitBtn.disabled=false;submitBtn.style.opacity='1';submitBtn.textContent='📤 रिपोर्ट भेजें';} return; }
    }
    const reportObj = {
      aboutId, aboutName, empName:aboutName, section:aboutSec,
      type, date, description:desc,
      status:'pending',
      reportedById:SESSION.empObjId||'admin',
      reportedByName:SESSION.name,
      submittedAt:new Date().toISOString()
    };
    if(imgData) reportObj.photo = imgData;
    const key=await fbPush('reports', reportObj);
    await fbUpdate(`reports/${key}`,{_key:key});
    closeModal(); toast(L('✅ रिपोर्ट भेज दी गई!','✅ Report submitted!'));
  }catch(e){
    toast('❌ Error: '+e.message);
    if(submitBtn){ submitBtn.disabled=false; submitBtn.style.opacity='1'; submitBtn.textContent='📤 रिपोर्ट भेजें'; }
  } finally {
    _reportSubmitting = false;
  }
}

let _rptPhotoOpen = false;
let _rptPhotoScrollY = 0;

function viewReportPhoto(el){
  try{
    const img = (el && el.tagName === 'IMG') ? el : (el && el.querySelector ? el.querySelector('img') : null);
    if(!img || !img.src) return;
    openReportPhotoFullscreen(img.src);
  }catch(e){ console.warn('[viewReportPhoto]', e); }
}

function openReportPhotoFullscreen(src){
  if(!src) return;
  // Remember scroll position so Back restores same place
  _rptPhotoScrollY = window.scrollY || window.pageYOffset || 0;
  let layer = document.getElementById('rptPhotoFs');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'rptPhotoFs';
    layer.className = 'rpt-photo-fs';
    layer.innerHTML = `
      <button type="button" class="rpt-photo-fs-close" aria-label="Close" onclick="closeReportPhotoFullscreen()">✕</button>
      <img class="rpt-photo-fs-img" alt="Full photo">
      <div class="rpt-photo-fs-hint">Tap image or ✕ · or press Back</div>`;
    // Tap backdrop (not img) closes
    layer.addEventListener('click', (ev)=>{
      if(ev.target === layer || ev.target.classList.contains('rpt-photo-fs-hint')) closeReportPhotoFullscreen();
    });
    document.body.appendChild(layer);
  }
  const fsImg = layer.querySelector('.rpt-photo-fs-img');
  if(fsImg){
    fsImg.src = src;
    fsImg.onclick = (e)=>{ e.stopPropagation(); closeReportPhotoFullscreen(); };
  }
  layer.classList.add('open');
  document.body.classList.add('rpt-photo-fs-lock');
  _rptPhotoOpen = true;
  // Push history so phone Back closes lightbox and stays on Reports
  try{
    if(!history.state || !history.state.rptPhoto){
      history.pushState({ rptPhoto: true }, '');
    }
  }catch(e){}
}

function closeReportPhotoFullscreen(){
  const layer = document.getElementById('rptPhotoFs');
  if(layer) layer.classList.remove('open');
  document.body.classList.remove('rpt-photo-fs-lock');
  const wasOpen = _rptPhotoOpen;
  _rptPhotoOpen = false;
  // Restore scroll
  try{ window.scrollTo(0, _rptPhotoScrollY || 0); }catch(e){}
  // If we pushed history and user closed via ✕, go back one step without leaving page
  try{
    if(wasOpen && history.state && history.state.rptPhoto){
      history.back();
    }
  }catch(e){}
}

// Phone Back while fullscreen photo is open
if(typeof window !== 'undefined' && !window._rptPhotoPopBound){
  window._rptPhotoPopBound = true;
  window.addEventListener('popstate', function(){
    if(_rptPhotoOpen){
      const layer = document.getElementById('rptPhotoFs');
      if(layer) layer.classList.remove('open');
      document.body.classList.remove('rpt-photo-fs-lock');
      _rptPhotoOpen = false;
      try{ window.scrollTo(0, _rptPhotoScrollY || 0); }catch(e){}
    }
  });
}

async function actReport(key, status){
  if(!canManageReports() && !isAdmin()){ toast(L('❌ Report permission नहीं है','❌ No report permission')); return; }
  await fbUpdate(`reports/${key}`,{status,actionAt:new Date().toISOString(),actionBy:SESSION.name});
  toast(status==='approved'?L('✅ रिपोर्ट मंजूर','✅ Report approved'):L('❌ रिपोर्ट अस्वीकार','❌ Report rejected'));
  renderAll();
}

async function deleteReport(key, name){
  if(!isAdminOrMgr()){ toast(L('❌ Permission नहीं है','❌ Permission denied')); return; }
  const ok = await confirmModal(
    'Report Delete करें?',
    `<b>${name||'यह report'}</b> permanently delete होगी।<br>यह action undo नहीं होगी।`,
    '🗑️ हाँ, Delete करें',
    'रद्द करें'
  );
  if(!ok) return;
  try{
    await fbRemove('reports/'+key);
    toast(L('🗑️ Report delete हो गई','🗑️ Report deleted'));
    renderReports();
  }catch(e){
    toast('❌ Delete failed: '+e.message);
  }
}

// ════════════════════════════════════════
// IMP. INFORMATION — anyone logged in can post; photos via Firebase Storage
// ════════════════════════════════════════
function openImpInfoForm(){
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;margin-bottom:12px">
    <div style="width:56px;height:56px;margin:0 auto 8px;border-radius:16px;background:linear-gradient(135deg,rgba(56,189,248,.25),rgba(99,102,241,.2));display:flex;align-items:center;justify-content:center;font-size:28px">📢</div>
    <div class="modal-title" style="margin-bottom:4px">${L('महत्वपूर्ण जानकारी','Important Information')}</div>
    <div style="font-size:13px;color:var(--muted2);line-height:1.4">${L('पूरी टीम के लिए सूचना पोस्ट करें','Share a notice with the whole team')}</div>
  </div>
  <div class="field"><label>📌 ${L('विषय','Title')} <span style="color:var(--lv)">*</span></label>
    <input type="text" id="imp_title" maxlength="80" placeholder="${L('जैसे: गलत माल आया — स्टोर वापस करें','e.g. Wrong material received — return to store')}"
      style="width:100%;padding:14px 16px;background:var(--card);border:2px solid var(--border2);border-radius:12px;color:var(--text);font-size:16px;outline:none;font-family:inherit;box-sizing:border-box"
      oninput="const c=document.getElementById('imp_title_cnt');if(c)c.textContent=(this.value||'').length+'/80'">
    <div id="imp_title_cnt" style="text-align:right;font-size:11px;color:var(--muted2);margin-top:4px">0/80</div>
  </div>
  <div class="field"><label>📋 ${L('पूरी जानकारी','Full details')} <span style="color:var(--lv)">*</span></label>
    <textarea id="imp_desc" maxlength="1000" placeholder="${L('सभी जरूरी details यहाँ लिखें...','Write all important details…')}"
      style="width:100%;padding:14px;background:var(--card);border:2px solid var(--border2);border-radius:12px;color:var(--text);font-size:15px;outline:none;resize:vertical;min-height:110px;font-family:inherit;box-sizing:border-box"
      oninput="const c=document.getElementById('imp_desc_cnt');if(c)c.textContent=(this.value||'').length+'/1000'"></textarea>
    <div id="imp_desc_cnt" style="text-align:right;font-size:11px;color:var(--muted2);margin-top:4px">0/1000</div>
  </div>
  <div class="field"><label>📅 ${L('तारीख','Date')}</label>
    <input type="date" id="imp_date" value="${TODAY_STR}"
      style="width:100%;padding:14px;background:var(--card);border:2px solid var(--border2);border-radius:12px;color:var(--text);font-size:16px;outline:none;box-sizing:border-box"></div>
  <div class="field">
    <label>📸 ${L('फोटो (वैकल्पिक)','Photo (optional)')}</label>
    <div id="imp_img_preview" style="display:none;margin-bottom:8px;border-radius:12px;overflow:hidden;max-height:220px;position:relative;border:1px solid var(--border2)">
      <img id="imp_img_thumb" style="width:100%;max-height:220px;object-fit:cover;display:block" src="" alt="">
      <button type="button" onclick="clearImpImg()" aria-label="Remove photo"
        style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.75);border:none;color:#fff;border-radius:50%;width:28px;height:28px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    <div style="display:flex;gap:8px">
      <button type="button" onclick="document.getElementById('imp_cam_input').click()"
        style="flex:1;padding:12px;border:1.5px dashed rgba(56,189,248,.4);border-radius:12px;
        background:rgba(56,189,248,.08);color:#38bdf8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        📸 ${L('कैमरा','Camera')}
      </button>
      <button type="button" onclick="document.getElementById('imp_img_input').click()"
        style="flex:1;padding:12px;border:1.5px dashed rgba(56,189,248,.4);border-radius:12px;
        background:rgba(56,189,248,.08);color:#38bdf8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        🖼️ ${L('गैलरी','Gallery')}
      </button>
    </div>
    <input type="file" id="imp_cam_input" accept="image/*" capture="environment" style="display:none" onchange="previewImpImg(this)">
    <input type="file" id="imp_img_input" accept="image/*" style="display:none" onchange="previewImpImg(this)">
  </div>
  <button class="submit-btn" onclick="submitImpInfo()" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">📢 ${L('पोस्ट करें','Post')}</button>
  <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

function clearImpImg(){
  try{
    const t=document.getElementById('imp_img_thumb'); if(t) t.src='';
    const p=document.getElementById('imp_img_preview'); if(p) p.style.display='none';
    const gi=document.getElementById('imp_img_input'); if(gi) gi.value='';
    const ci=document.getElementById('imp_cam_input'); if(ci) ci.value='';
  }catch(e){}
}

function previewImpImg(input){
  const file = input.files && input.files[0]; if(!file) return;
  if(file.size > 10*1024*1024){ toast(L('⚠️ 10MB से छोटी फोटो चुनें','⚠️ Choose a photo under 10MB')); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const thumb=document.getElementById('imp_img_thumb');
    const prev=document.getElementById('imp_img_preview');
    if(thumb) thumb.src = e.target.result;
    if(prev) prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

let _impInfoSubmitting = false;
async function submitImpInfo(){
  if(_impInfoSubmitting) return;
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const title = (document.getElementById('imp_title')?.value||'').trim().slice(0,80);
  const desc = (document.getElementById('imp_desc')?.value||'').trim().slice(0,1000);
  const date = document.getElementById('imp_date')?.value || TODAY_STR;
  if(!title){ toast(L('⚠️ विषय (Title) लिखें','⚠️ Enter a title')); return; }
  if(!desc){ toast(L('⚠️ जानकारी (Details) लिखें','⚠️ Enter details')); return; }

  const submitBtn = document.querySelector('.modal button[onclick*="submitImpInfo"]');
  if(submitBtn){ submitBtn.disabled=true; submitBtn.style.opacity='.6'; submitBtn.textContent=L('⏳ पोस्ट हो रहा है...','⏳ Posting…'); }
  _impInfoSubmitting = true;

  let photoUrl = null;
  let localPreview = null;
  try{
    const imgInput = document.getElementById('imp_img_input');
    const camInput = document.getElementById('imp_cam_input');
    const activeImgInput = (camInput && camInput.files && camInput.files[0]) ? camInput : (imgInput && imgInput.files && imgInput.files[0]) ? imgInput : null;
    if(activeImgInput && activeImgInput.files && activeImgInput.files[0]){
      let imgData = await new Promise((res,rej)=>{
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(activeImgInput.files[0]);
      });
      try{ imgData = await compressImage(imgData, 1000, 0.65); }catch(e){}
      localPreview = imgData;
      const uid = (SESSION && (SESSION.empObjId || SESSION.mobile || SESSION.uid)) || 'anon';
      const path = 'reportPhotos/imp_info/' + String(uid).replace(/[^a-zA-Z0-9_-]/g,'_') + '_' + Date.now() + '.jpg';
      if(typeof window._fbUploadSelfie === 'function'){
        photoUrl = await window._fbUploadSelfie(imgData, path);
      }
      if(!photoUrl){
        // Fallback: keep compressed base64 only if Storage fails (legacy)
        if(imgData && imgData.length > 450000){
          toast(L('⚠️ फोटो अपलोड नहीं हुई','⚠️ Photo too large / upload failed'));
          throw new Error('photo_upload_failed');
        }
      }
    }

    const reportObj = {
      aboutId: 'all',
      aboutName: L('सभी कर्मचारी','All team'),
      empName: title,
      title: title,
      section: 'ALL',
      type: 'imp_info',
      date,
      description: desc,
      status: 'approved',
      reportedById: (SESSION && SESSION.empObjId) || 'user',
      reportedByName: (SESSION && SESSION.name) || 'User',
      submittedAt: new Date().toISOString()
    };
    if(photoUrl) reportObj.photoUrl = photoUrl;
    else if(localPreview) reportObj.photo = localPreview; // last-resort fallback

    const key = await fbPush('reports', reportObj);
    await fbUpdate('reports/'+key, {_key:key});
    reportObj._key = key;

    // Optimistic local cache so list updates immediately
    try{
      if(!_cache.reports) _cache.reports = [];
      _cache.reports = [reportObj].concat(_cache.reports.filter(r=>r && r._key !== key));
    }catch(e){}

    // Switch to Imp Info filter and show card
    _rfFilter = 'imp_info';
    try{
      document.querySelectorAll('#reportFilter .chip').forEach(c=>c.classList.remove('on'));
      const chip = document.querySelector('#reportFilter .chip[onclick*="imp_info"]');
      if(chip) chip.classList.add('on');
    }catch(e){}

    closeModal();
    toast(L('📢 Information पोस्ट हो गई!','📢 Notice posted!'));
    renderReports();

    // Notify others (best-effort, non-blocking)
    setTimeout(async ()=>{
      try{
        const myId = SESSION && SESSION.empObjId;
        const activeEmps = getEmps().filter(e=>e.status!=='resigned' && e.id !== myId).slice(0, 80);
        for(const emp of activeEmps){
          try{
            await fbPush('userNotifications/'+emp.id, {
              title: '📢 ' + title,
              body: desc.substring(0,100) + (desc.length>100?'...':''),
              read: false,
              at: new Date().toISOString(),
              changedBy: (SESSION && SESSION.name) || '',
              type: 'imp_info'
            });
          }catch(e){}
        }
      }catch(e){}
    }, 50);
  }catch(e){
    const msg = (e && e.message) ? String(e.message) : String(e);
    if(/permission|PERMISSION/i.test(msg)){
      toast(L('❌ Permission denied — Admin से reports rules अपडेट करवाएँ','❌ Permission denied — ask Admin to update reports rules'));
    } else if(msg !== 'photo_upload_failed'){
      toast('❌ ' + (L('Error: ','Error: ')) + msg);
    }
    if(submitBtn){ submitBtn.disabled=false; submitBtn.style.opacity='1'; submitBtn.textContent=L('📢 पोस्ट करें','📢 Post'); }
  } finally {
    _impInfoSubmitting = false;
  }
}

// ════════════════════════════════════════
// ════════════════════════════════════════
// PENDING (ADMIN)
// ════════════════════════════════════════
function renderPendingDevices(){
  const adminBlock=document.getElementById('adminOnlyPendingBlock');
  // Managers must see Login Requests (member + device approvals). Only pure members hide this block.
  if(adminBlock) adminBlock.style.display=(isAdmin() || isMgr()) ? 'block' : 'none';
  setTimeout(renderMyTeamApprovals,100);
  if(!isAdmin()){
    // Managers still need device-change list empty / skip admin-only deviceChangeRequests
    const el = document.getElementById('pendingDevices');
    if(el && isMgr()) el.innerHTML='';
    return;
  }
  setTimeout(renderManagerApprovals,100);
  const el = document.getElementById('pendingDevices');
  if(!el) return;
  fbGet('deviceChangeRequests').then(data=>{
    const reqs = data ? Object.entries(data).filter(([k,v])=>v.status==='pending') : [];
    if(!reqs.length){ el.innerHTML='<div class="empty" style="padding:16px"><div class="empty-text" style="font-size:12px">कोई device request नहीं</div></div>'; return; }
    el.innerHTML = reqs.map(([k,v])=>`
      <div class="card">
        <div class="card-row">
          <div class="card-ico" style="background:rgba(56,189,248,.12)">📱</div>
          <div class="card-body">
            <div class="card-name">${v.empName}</div>
            <div class="card-sub">नया Device Login Request</div>
            <div class="card-meta">${new Date(v.requestedAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN'))}</div>
          </div>
        </div>
        <div class="action-row">
          <button class="act-btn approve" onclick="approveDevice('${k}','${v.empObjId}','${v.newDeviceId}','${v.empName}')">✅ Approve</button>
          <button class="act-btn reject"  onclick="rejectDevice('${k}')">❌ Reject</button>
        </div>
      </div>`).join('');
  });
}

async function approveDevice(reqKey, empObjId, newDeviceId, empName){
  const validTill = new Date(Date.now() + 365*86400000).toISOString();
  try{
    if(typeof _ensureWriteAuth==='function') await _ensureWriteAuth();
    await fbUpdate('deviceApprovals/' + empObjId, {
      approvedDeviceId: newDeviceId,
      approvedAt: new Date().toISOString(),
      validTill, empName, approvedBy: SESSION.name
    });
    await fbUpdate('deviceChangeRequests/' + reqKey, { status:'approved' });
    toast('✅ ' + empName + ' ka new device approve ho gaya! (1 year validity)');
    renderPendingDevices();
  }catch(e){
    toast('❌ Approve failed: '+(e.message||e));
  }
}
async function rejectDevice(reqKey){
  await fbUpdate('deviceChangeRequests/' + reqKey, { status:'rejected' });
  toast('❌ Device request reject ki gayi');
  renderPendingDevices();
}

// ════════════════════════════════════════
// 🔑 MANAGER / MEMBER REGISTRATION APPROVALS (Admin Panel)
// ════════════════════════════════════════
function renderManagerApprovals(){
  const el=document.getElementById('mgrApprovalsSection');
  if(!el) return;
  // Only Admin approves other managers (managers are auto-approved on self-register)
  if(!isAdmin()){
    el.innerHTML = '';
    return;
  }
  fbGet('mobileUsers').then(data=>{
    if(!data){ el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">कोई pending registration नहीं</div>'; return; }
    const entries=Object.entries(data).filter(([k,v])=>v.status==='pending'&&v.role==='manager');
    if(!entries.length){ el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">कोई pending Manager registration नहीं</div>'; return; }
    el.innerHTML=entries.map(([mobile,u])=>`
      <div class="card" style="margin-bottom:10px">
        <div class="card-row">
          <div class="card-ico" style="background:rgba(249,115,22,.12)">👔</div>
          <div class="card-body">
            <div class="card-name">${u.name} <span style="font-size:10px;background:rgba(249,115,22,.15);color:#f97316;padding:2px 6px;border-radius:4px;margin-left:4px">MANAGER</span></div>
            <div class="card-sub">📱 ${u.mobile} &nbsp;·&nbsp; 🏢 ${u.company||'—'}</div>
            ${u.designation?'<div class="card-meta">'+u.designation+(u.department?' · '+u.department:'')+'</div>':''}
            <div class="card-meta">${new Date(u.registeredAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN'))}</div>
          </div>
        </div>
        <div class="action-row">
          <button class="act-btn approve" onclick="openApproveMemberModal('${mobile}')">✅ Approve</button>
          <button class="act-btn reject"  onclick="rejectMobileUser('${mobile}','${u.name}')">❌ Reject</button>
        </div>
      </div>`).join('');
  });
}


/** Manager: open form to set Section / Machine / Resp / Designation then approve + add to roster */
async function openApproveMemberModal(mobile){
  const key = (typeof _normMobileKey==='function') ? _normMobileKey(mobile) : String(mobile||'').replace(/\D/g,'').slice(-10);
  let u = null;
  try{ u = await fbGet('mobileUsers/'+key); }catch(e){}
  if(!u){ toast('❌ Member data not found'); return; }
  const name = String(u.name||key).replace(/</g,'');
  const phone = String(u.mobile||key).replace(/</g,'');
  const preCode = String(u.empCode||u.empId||'').replace(/</g,'');
  // Build option lists from existing team (Excel values — no hardcoded map)
  const secs = (typeof _teamFieldValues==='function' ? _teamFieldValues('section') : []) || [];
  const mcs  = (typeof _teamFieldValues==='function' ? _teamFieldValues('machine') : []) || [];
  const resps= (typeof _teamFieldValues==='function' ? _teamFieldValues('responsibility') : []) || [];
  const desigs=(typeof _teamFieldValues==='function' ? _teamFieldValues('designation') : []) || [];
  const opt = (arr, ph) => '<option value="">'+ph+'</option>' + arr.map(v=>'<option value="'+String(v).replace(/"/g,'&quot;')+'">'+String(v).replace(/</g,'')+'</option>').join('') + '<option value="__other__">Other…</option>';
  const html = `<div class="modal-handle"></div>
    <div class="modal-title">✅ ${L('Member Approve + Roster','Approve Member + Add to roster')}</div>
    <div style="font-size:13px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      <b style="color:var(--text)">${name}</b> · ${phone}<br>
      ${L('Schedule में दिखने के लिए Section / Machine आदि भरें — Teams में अलग से add करने की जरूरत नहीं।','Fill Section / Machine etc. so they appear on Schedule — no need to add again under Team.')}
    </div>
    <div class="field"><label>Employee Code / Emp ID *</label>
      <input class="inp-field" id="appr_empCode" value="${preCode}" placeholder="e.g. 30000422"></div>
    <div class="field"><label>Section *</label>
      <select class="inp-field" id="appr_section" onchange="_apprToggleOther('appr_section','appr_section_other')">${opt(secs,'— Select Section —')}</select>
      <input class="inp-field" id="appr_section_other" placeholder="Section name" style="display:none;margin-top:6px"></div>
    <div class="field"><label>Machine *</label>
      <select class="inp-field" id="appr_machine" onchange="_apprToggleOther('appr_machine','appr_machine_other')">${opt(mcs,'— Select Machine —')}</select>
      <input class="inp-field" id="appr_machine_other" placeholder="Machine name" style="display:none;margin-top:6px"></div>
    <div class="field"><label>Responsibility</label>
      <select class="inp-field" id="appr_resp" onchange="_apprToggleOther('appr_resp','appr_resp_other')">${opt(resps,'— Select —')}</select>
      <input class="inp-field" id="appr_resp_other" placeholder="Responsibility" style="display:none;margin-top:6px"></div>
    <div class="field"><label>Designation</label>
      <select class="inp-field" id="appr_desig" onchange="_apprToggleOther('appr_desig','appr_desig_other')">${opt(desigs,'— Select —')}</select>
      <input class="inp-field" id="appr_desig_other" placeholder="Designation" style="display:none;margin-top:6px"></div>
    <div class="field"><label>Weekly Off</label>
      <select class="inp-field" id="appr_woff">
        <option value="SUN">SUN</option><option value="MON">MON</option><option value="TUE">TUE</option>
        <option value="WED">WED</option><option value="THU">THU</option><option value="FRI">FRI</option><option value="SAT">SAT</option>
      </select></div>
    <div id="appr_err" style="display:none;color:#f87171;font-size:12px;font-weight:700;margin-bottom:8px"></div>
    <button class="submit-btn" onclick="confirmApproveMember('${key}')">${L('✅ Approve + Schedule में जोड़ें','✅ Approve + Add to Schedule')}</button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द','Cancel')}</button>`;
  openModal(html);
}
function _apprToggleOther(selId, otherId){
  const sel = document.getElementById(selId);
  const o = document.getElementById(otherId);
  if(!sel||!o) return;
  o.style.display = sel.value==='__other__' ? 'block' : 'none';
  if(sel.value==='__other__') o.focus();
}
function _apprResolve(selId, otherId){
  const sel = document.getElementById(selId);
  if(!sel) return '';
  if(sel.value==='__other__') return (document.getElementById(otherId)?.value||'').trim();
  return (sel.value||'').trim();
}

async function confirmApproveMember(mobileKey){
  const key = (typeof _normMobileKey==='function') ? _normMobileKey(mobileKey) : String(mobileKey||'').replace(/\D/g,'').slice(-10);
  const err = document.getElementById('appr_err');
  const showErr = (t)=>{ if(err){ err.style.display='block'; err.textContent=t; } else toast(t); };
  const empCode = (document.getElementById('appr_empCode')?.value||'').trim();
  const section = _apprResolve('appr_section','appr_section_other');
  const machine = _apprResolve('appr_machine','appr_machine_other');
  const resp = _apprResolve('appr_resp','appr_resp_other');
  const desig = _apprResolve('appr_desig','appr_desig_other');
  const woff = (document.getElementById('appr_woff')?.value||'SUN').toUpperCase().slice(0,3);
  if(!empCode){ showErr(L('⚠️ Employee Code जरूरी है','⚠️ Employee Code is required')); return; }
  if(!section){ showErr(L('⚠️ Section जरूरी है','⚠️ Section is required')); return; }
  if(!machine){ showErr(L('⚠️ Machine जरूरी है','⚠️ Machine is required')); return; }

  let u = null;
  try{ u = await fbGet('mobileUsers/'+key); }catch(e){}
  if(!u){ showErr('❌ Member not found'); return; }

  // Duplicate emp code check
  try{
    const clash = (getEmps()||[]).find(e => e && e.status!=='resigned' && e.empId && String(e.empId).trim().toUpperCase()===empCode.toUpperCase()
      && _normMobileKey(e.phone||e.mobile||'')!==key);
    if(clash){ showErr(L('⚠️ Emp Code पहले से है: ','⚠️ Emp Code already used by: ')+(clash.name||'')); return; }
  }catch(e){}

  const mgrId = (typeof _normMobileKey==='function')
    ? _normMobileKey(SESSION.mobile||SESSION.uid||'')
    : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
  const sec = section || machine || 'General';
  const phone10 = key;

  // Reuse existing employee by phone if any
  let empId = null;
  let existing = null;
  try{
    existing = (getEmps()||[]).find(e => e && _normMobileKey(e.phone||e.mobile||'')===phone10);
    if(existing) empId = existing.id;
  }catch(e){}
  if(!empId) empId = 'e'+Date.now().toString(36);

  const emp = {
    id: empId,
    name: String(u.name||'').toUpperCase(),
    empId: empCode,
    sec: sec,
    section: section,
    mc: machine,
    machine: machine,
    resp: resp || '',
    responsibility: resp || '',
    designation: desig || '',
    woff: woff,
    status: 'active',
    phone: phone10,
    mobile: phone10,
    managerId: mgrId,
    companyId: (typeof myCompanyId==='function' && myCompanyId()!=='ALL') ? myCompanyId() : (u.company||SESSION.companyId||'default'),
    companyLabel: u.company || SESSION.company || '',
    company: u.company || SESSION.company || '',
    ms: Array(31).fill(''),
    addedVia: 'member_approve',
    addedAt: new Date().toISOString()
  };

  try{
    if(typeof _ensureWriteAuth==='function') await _ensureWriteAuth();
  }catch(e){}

  try{
    await fbUpdate('employees/'+empId, emp);
  }catch(e){
    try{ await fbSet('employees/'+empId, emp); }catch(e2){
      showErr('❌ Roster save failed: '+(e2.message||e.message)); return;
    }
  }
  // Update local cache so schedule sees them immediately
  try{
    if(!_cache.employees) _cache.employees = [];
    const ix = _cache.employees.findIndex(e=>e && e.id===empId);
    if(ix>=0) _cache.employees[ix] = Object.assign({}, _cache.employees[ix], emp);
    else _cache.employees.push(emp);
  }catch(e){}

  try{
    await fbUpdate('mobileUsers/'+key, {
      status:'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: SESSION.name||'Manager',
      empCode: empCode,
      empId: empCode,
      empObjId: empId,
      employeeId: empId,
      managerId: mgrId,
      section: section,
      machine: machine,
      responsibility: resp,
      designation: desig,
      woff: woff
    });
  }catch(e){ showErr('❌ Approve failed: '+e.message); return; }

  try{
    await fbPush('userNotifications/'+key, {
      type:'member_approved',
      title:'✅ Approved',
      body:'Manager approved you and added you to the team schedule roster',
      read:false, at: new Date().toISOString()
    });
  }catch(e){}

  closeModal();
  toast((typeof L==='function')?L('✅ Approve + Schedule roster में जोड़ दिया','✅ Approved and added to schedule roster'):'✅ Approved and added to schedule roster');
  try{ renderMyTeamApprovals(); }catch(e){}
  try{ renderManagerApprovals(); }catch(e){}
  try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
  try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
  try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
}

async function approveMobileUser(mobile){
  // Back-compat: open the onboarding modal instead of silent approve
  return openApproveMemberModal(mobile);
}

async function rejectMobileUser(mobile,name){
  const ok=await confirmModal('Reject करें?','<b>'+name+'</b> का registration reject करें?','❌ Reject','रद्द');
  if(!ok) return;
  try{
    await fbUpdate('mobileUsers/'+mobile,{status:'rejected',rejectedAt:new Date().toISOString(),rejectedBy:SESSION.name});
    toast('❌ '+name+L(' का registration reject हो गया',' registration rejected'));
    renderManagerApprovals();
    renderMyTeamApprovals();
  }catch(e){ toast('❌ Error: '+e.message); }
}

// ── Manager approves their OWN pending team Members ──
function renderMyTeamApprovals(){
  const block=document.getElementById('myTeamApprovalsBlock');
  const el=document.getElementById('myTeamApprovalsSection');
  if(!block||!el) return;
  if(SESSION.role!=='manager'){ block.style.display='none'; return; }
  block.style.display='block';
  const myKey = (typeof _normMobileKey==='function')
    ? _normMobileKey(SESSION.mobile||SESSION.uid||SESSION.phone||'')
    : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
  const myIds = new Set([myKey, String(SESSION.uid||''), String(SESSION.empObjId||''), String(SESSION.mobile||'')].filter(Boolean).map(s=>{
    try{ return (typeof _normMobileKey==='function') ? _normMobileKey(s) : String(s).replace(/\D/g,'').slice(-10); }catch(e){ return String(s); }
  }));
  fbGet('mobileUsers').then(data=>{
    if(!data){ el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">No pending members</div>'; return; }
    const entries=Object.entries(data).filter(([k,v])=>{
      if(!v || v.status!=='pending' || v.role!=='member') return false;
      const midRaw = v.managerId||v.managerMobile||v.mgrId||'';
      const mid = (typeof _normMobileKey==='function') ? _normMobileKey(midRaw) : String(midRaw).replace(/\D/g,'').slice(-10);
      if(!mid) return false;
      if(myIds.has(mid) || mid===myKey) return true;
      // raw equality fallback (legacy keys)
      if(String(midRaw)===String(SESSION.uid) || String(midRaw)===String(SESSION.empObjId)) return true;
      return false;
    });
    if(!entries.length){ el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+L('कोई pending member नहीं','No pending members')+'</div>'; return; }
    el.innerHTML=entries.map(([mobile,u])=>`
      <div class="card" style="margin-bottom:10px">
        <div class="card-row">
          <div class="card-ico" style="background:rgba(96,165,250,.12)">👤</div>
          <div class="card-body">
            <div class="card-name">${u.name} <span style="font-size:10px;background:rgba(96,165,250,.15);color:#60a5fa;padding:2px 6px;border-radius:4px;margin-left:4px">MEMBER</span></div>
            <div class="card-sub">📱 ${u.mobile} &nbsp;·&nbsp; 🏢 ${u.company||'—'}</div>
            <div class="card-meta">${new Date(u.registeredAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN'))}</div>
          </div>
        </div>
        <div class="action-row">
          <button class="act-btn approve" onclick="openApproveMemberModal('${mobile}')">✅ Approve</button>
          <button class="act-btn reject"  onclick="rejectMobileUser('${mobile}','${u.name}')">❌ Reject</button>
        </div>
      </div>`).join('');
  });
}

// ── Admin: Managers & their Teams hierarchy view ──

/** Admin: delete a manager and all members under them from mobileUsers */
function confirmDeleteManagerWithTeam(mgrKey, mgrName, memberCount){
  if(!isAdmin()){ toast(L('❌ Admin only','❌ Admin only')); return; }
  const title = L('🗑️ Manager + Team Delete','🗑️ Delete Manager + Team');
  const msg = L(
    'Manager <b>'+(mgrName||'')+'</b> और उनकी पूरी team (<b>'+memberCount+'</b> members) delete करें?<br><br>यह mobile registration हटा देगा — अगली बार <b>fresh person</b> की तरह login होगा।',
    'Delete Manager <b>'+(mgrName||'')+'</b> and their full team (<b>'+memberCount+'</b> members)?<br><br>This removes mobile registration — next login will be treated as a <b>fresh</b> user.'
  );
  if(typeof confirmModal==='function'){
    confirmModal(title, msg, L('🗑️ हाँ, Delete','🗑️ Yes, Delete'), L('रद्द करें','Cancel')).then(ok=>{
      if(ok) deleteManagerWithTeam(mgrKey, mgrName);
    });
    return;
  }
  if(!confirm(msg.replace(/<[^>]+>/g,' '))) return;
  deleteManagerWithTeam(mgrKey, mgrName);
}

async function deleteManagerWithTeam(mgrKey, mgrName){
  if(!isAdmin()){ toast(L('❌ Admin only','❌ Admin only')); return; }
  try{
    toast(L('⏳ Deleting…','⏳ Deleting…'));
    // Admin delete needs Phone Auth + admins/{uid} for RTDB rules
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){
        toast(L('❌ Phone OTP verify करें — फिर Delete दबाएँ','❌ Verify phone OTP — then press Delete'));
        return;
      }
    }
    try{ if(typeof _syncAuthRoleNodes==='function') await _syncAuthRoleNodes(); }catch(e){}

    const data = await fbGet('mobileUsers') || {};
    const mk = (typeof _normMobileKey==='function') ? _normMobileKey(mgrKey) : String(mgrKey||'').replace(/\D/g,'').slice(-10);
    let mgrRec = data[mgrKey] || data[mk] || null;
    if(!mgrRec){
      const hit = Object.entries(data).find(([k])=> ((typeof _normMobileKey==='function')?_normMobileKey(k):k)===mk);
      if(hit){ mgrRec = hit[1]; }
    }
    const mgrMob = (typeof _normMobileKey==='function')
      ? _normMobileKey((mgrRec && (mgrRec.mobile||mgrRec.phone)) || mk)
      : mk;

    const toDelete = new Set();
    Object.entries(data).forEach(([k,v])=>{
      if(!v) return;
      const keyN = (typeof _normMobileKey==='function') ? _normMobileKey(k) : String(k||'').replace(/\D/g,'').slice(-10);
      if(keyN===mk || keyN===mgrMob || k===mgrKey){ toDelete.add(k); return; }
      const mid = (typeof _normMobileKey==='function')
        ? _normMobileKey(v.managerId||v.managerMobile||v.mgrId||'')
        : String(v.managerId||'').replace(/\D/g,'').slice(-10);
      if(mid && (mid===mk || mid===mgrMob)) toDelete.add(k);
    });

    // Also wipe employees roster rows under this manager (fresh login next time)
    const empKeys = [];
    try{
      const emps = await fbGet('employees') || {};
      Object.entries(emps).forEach(([id,e])=>{
        if(!e) return;
        const em = (typeof _normMobileKey==='function')
          ? _normMobileKey(e.phone||e.mobile||'')
          : String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10);
        const mid = (typeof _normMobileKey==='function')
          ? _normMobileKey(e.managerId||e.managerMobile||e.mgrId||'')
          : String(e.managerId||'').replace(/\D/g,'').slice(-10);
        if(em && (em===mk || em===mgrMob)) empKeys.push(id);
        else if(mid && (mid===mk || mid===mgrMob)) empKeys.push(id);
      });
    }catch(e){ console.warn('[deleteMgr] employees scan', e); }

    // Device approvals / pending under these phones
    const extraPaths = [];
    for(const k of toDelete){
      const n = (typeof _normMobileKey==='function') ? _normMobileKey(k) : String(k||'').replace(/\D/g,'').slice(-10);
      if(n && n.length===10){
        extraPaths.push('deviceApprovals/'+n);
        extraPaths.push('pendingMembers/'+n);
        extraPaths.push('userNotifications/'+n);
      }
    }

    let ok=0, fail=0;
    const failKeys = [];
    // Prefer multi-path null write when available
    try{
      if(typeof fbUpdate==='function' && toDelete.size){
        const patch = {};
        toDelete.forEach(k=>{ patch['mobileUsers/'+k] = null; });
        empKeys.forEach(id=>{ patch['employees/'+id] = null; });
        extraPaths.forEach(path=>{ patch[path] = null; });
        await fbUpdate('/', patch);
        ok = toDelete.size;
      } else {
        throw new Error('no multipath');
      }
    }catch(multiErr){
      console.warn('[deleteMgr] multipath failed, per-key', multiErr && multiErr.message);
      for(const k of toDelete){
        try{
          if(typeof fbRemove==='function') await fbRemove('mobileUsers/'+k);
          else await fbSet('mobileUsers/'+k, null);
          ok++;
        }catch(e){
          // Soft tombstone if hard delete blocked by rules
          try{
            await fbUpdate('mobileUsers/'+k, {
              status: 'removed',
              role: 'removed',
              name: null,
              removedAt: new Date().toISOString(),
              removedBy: SESSION.name||'admin',
              forceFreshLogin: true
            });
            ok++;
          }catch(e2){
            fail++;
            failKeys.push(k);
            console.warn('[deleteMgr] fail', k, e2 && e2.message);
          }
        }
      }
      for(const id of empKeys){
        try{
          if(typeof fbRemove==='function') await fbRemove('employees/'+id);
          else await fbSet('employees/'+id, null);
        }catch(e){ console.warn('[deleteMgr] emp', id, e); }
      }
      for(const path of extraPaths){
        try{
          if(typeof fbRemove==='function') await fbRemove(path);
          else await fbSet(path, null);
        }catch(e){}
      }
    }

    // Local cache cleanup so UI updates immediately
    try{
      if(_cache && _cache.mobileUsers){
        toDelete.forEach(k=>{ try{ delete _cache.mobileUsers[k]; }catch(e){} });
      }
      if(_cache && Array.isArray(_cache.employees) && empKeys.length){
        const drop = new Set(empKeys);
        _cache.employees = _cache.employees.filter(e=>e && !drop.has(e.id) && !drop.has(e.empId));
      }
    }catch(e){}

    if(ok && !fail){
      toast(L('✅ ','✅ ')+(mgrName||'Manager')+L(' + team हटाए — अगली बार fresh login',' + team removed — next login is fresh'));
    } else if(ok && fail){
      toast(L('⚠️ आंशिक delete: ','⚠️ Partial delete: ')+ok+L(' ok, ',' ok, ')+fail+L(' failed (Firebase rules)',' failed (Firebase rules)'));
    } else {
      toast(L('❌ Delete failed — Admin phone OTP से login करें, या Firebase rules deploy करें','❌ Delete failed — login with Admin phone OTP, or deploy Firebase rules'));
      if(failKeys.length) console.warn('[deleteMgr] failed keys', failKeys);
    }
    try{ renderAdminTeamHierarchy(); }catch(e){}
    try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
  }catch(err){
    console.error(err);
    toast(L('❌ Delete failed: ','❌ Delete failed: ')+(err.message||err));
  }
}

function renderAdminTeamHierarchy(){
  const block=document.getElementById('adminTeamHierarchyBlock');
  const el=document.getElementById('adminTeamHierarchySection');
  if(!block||!el) return;
  if(!isAdmin()){ block.style.display='none'; return; }
  block.style.display='block';
  fbGet('mobileUsers').then(data=>{
    if(!data){
      el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+((typeof L==='function')?L('कोई registered Manager नहीं','No registered managers'):'No registered managers')+'</div>';
      return;
    }
    try{ _cache.mobileUsers = data; }catch(e){}
    const allRaw = Object.entries(data);
    const viewCid = SESSION.viewCompanyId || 'ALL';
    const mgrKeyNorm = (k)=> (typeof _normMobileKey==='function' ? _normMobileKey(k) : String(k||'').replace(/\D/g,'').slice(-10));

    const managers = allRaw.filter(([k,v])=>{
      if(!v || v.role!=='manager' || v.status==='rejected' || v.status==='removed') return false;
      if(!viewCid || viewCid==='ALL') return true;
      const n = _normCompanyId(v.company);
      const vcid = _normCompanyId(viewCid);
      return n === vcid || n === 'default';
    });
    const managerKeys = new Set(managers.map(([k])=>mgrKeyNorm(k)));
    const managerKeySet = new Set(managers.map(([k])=>k));

    const uncategorised = allRaw.filter(([k,v])=>{
      if(!v || v.status==='rejected' || v.status==='removed') return false;
      const role = String(v.role||'').toLowerCase();
      if(role==='manager' || role==='admin') return false;
      if(viewCid && viewCid!=='ALL' && !_companyMatchesView(v.company, viewCid)) return false;
      const mk = mgrKeyNorm(v.managerId || v.managerMobile || '');
      if(!v.managerId && !v.managerMobile) return true;
      return !managerKeys.has(mk) && !managerKeySet.has(v.managerId);
    });

    if(!managers.length && !uncategorised.length){
      el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+((typeof L==='function')?L('कोई registered Manager/Member नहीं','No registered Manager/Member'):'No registered Manager/Member')+'</div>';
      return;
    }

    let html = managers.map(([mgrKey,mgr])=>{
      const mk = mgrKeyNorm(mgrKey);
      const mgrMob = mgrKeyNorm(mgr.mobile || mgr.phone || mk);
      const members = allRaw.filter(([k,v])=>{
        if(!v || v.status==='rejected' || v.status==='removed') return false;
        const role = String(v.role||'').toLowerCase();
        if(role==='manager' || role==='admin') return false;
        const mid = mgrKeyNorm(v.managerId || v.managerMobile || v.mgrId || '');
        const linked = (mid && (mid === mk || mid === mgrMob))
          || (v.managerId && (String(v.managerId)===String(mgrKey) || mgrKeyNorm(v.managerId)===mk));
        if(!linked) return false;
        if(viewCid && viewCid!=='ALL'){
          const mc = _normCompanyId(v.company||'');
          if(mc && mc!=='default' && mc !== _normCompanyId(viewCid)) return false;
        }
        return true;
      });
      // Also count Excel/roster employees under this manager (employees.managerId)
      let rosterCount = 0;
      try{
        const empsAll = (typeof getEmps==='function' ? getEmps() : (_cache.employees||[])) || [];
        const seenMob = new Set(members.map(([k,v])=>mgrKeyNorm(v.mobile||v.phone||k)));
        empsAll.forEach(e=>{
          if(!e || e.status==='resigned'||e.status==='left'||e.status==='left_team'||e.status==='removed') return;
          const emid = mgrKeyNorm(e.managerId||'');
          if(!(emid && (emid===mk || emid===mgrMob))) return;
          if(viewCid && viewCid!=='ALL'){
            const mc = _normCompanyId(e.companyId||e.company||'');
            if(mc && mc!=='default' && mc!==_normCompanyId(viewCid)) return;
          }
          const emMob = mgrKeyNorm(e.phone||e.mobile||'');
          if(emMob && seenMob.has(emMob)) return; // already in mobile members
          rosterCount++;
        });
      }catch(e){}
      const statusBadge = _mobileStatusBadge(mgr);
      const noMemLbl = (typeof L==='function') ? L('इस Manager के अंतर्गत कोई Member नहीं','No members under this Manager') : 'No members under this Manager';
      const membersHtml = members.length ? members.map(([memKey,mem])=>`
          <div class="adm-mem-row" style="padding:10px 12px;border-top:1px solid var(--border2);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div style="flex:1;min-width:120px">
              <div style="font-size:13px;font-weight:700;color:var(--text)">👤 ${String(mem.name||'').replace(/</g,'')}</div>
              <div style="font-size:11px;color:#64748b">📱 ${mem.mobile||mem.phone||memKey}</div>
            </div>
            ${_mobileStatusBadge(mem)}
            ${_mobileActionButtons(memKey,mem.name,mem.status)}
          </div>`).join('')
        : `<div style="padding:10px 12px;border-top:1px solid var(--border2);font-size:11px;color:#64748b">${noMemLbl}</div>`;
      const expLbl = (typeof L==='function') ? L('📅 Expiry (team)','📅 Expiry (team)') : '📅 Expiry (team)';
      const delLbl = (typeof L==='function') ? L('🗑️ Delete Manager + Team','🗑️ Delete Manager + Team') : '🗑️ Delete Manager + Team';
      const memCountLbl = (typeof L==='function') ? L('members','members') : 'members';
      const safeName = String(mgr.name||'').replace(/'/g,"\\'").replace(/</g,'');
      const safeKey = String(mgrKey).replace(/'/g,"\\'");
      return `
      <div class="card adm-mgr-card team-fold" data-open="0" style="margin-bottom:12px;padding:0;overflow:hidden">
        <div class="team-fold-hdr" style="padding:12px;background:rgba(249,115,22,.06);cursor:pointer;user-select:none"
          onclick="if(!event.target.closest('button,a,input')){ const b=this.parentElement; const body=b.querySelector('.team-fold-body'); const chev=this.querySelector('.team-fold-chev'); if(!body)return; const open=body.style.display!=='none'; body.style.display=open?'none':'block'; if(chev)chev.textContent=open?'▶':'▼'; b.setAttribute('data-open',open?'0':'1'); }">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span class="team-fold-chev" style="font-size:12px;color:var(--muted2);width:14px;line-height:22px">▶</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:15px;font-weight:900;color:var(--text);line-height:1.25">👔 ${safeName}</div>
              <div style="font-size:12px;font-weight:700;color:var(--m1,#f97316);margin-top:2px">${members.length} ${typeof L==='function'?L('मोबाइल','mobile'):'mobile'}${(typeof rosterCount!=='undefined' && rosterCount)?(' · '+rosterCount+' '+(typeof L==='function'?L('रोस्टर में','in roster'):'in roster')):''}</div>
              <div style="font-size:11px;color:#64748b;margin-top:3px;word-break:break-all">📱 ${mgr.mobile||mgr.phone||mgrKey}</div>
              <div style="font-size:11px;color:#64748b">🏢 ${mgr.company||'—'}</div>
            </div>
            <div style="flex-shrink:0">${statusBadge}</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px" onclick="event.stopPropagation()">
            ${_mobileActionButtons(mgrKey,mgr.name,mgr.status)}
            ${members.length?`<button type="button" onclick="event.stopPropagation();openAdminSetExpiryModal('${safeKey}','${safeName}',true)" style="font-size:11px;padding:7px 10px;border-radius:8px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;cursor:pointer">${expLbl}</button>`:''}
            <button type="button" onclick="event.stopPropagation();confirmDeleteManagerWithTeam('${safeKey}','${safeName}',${members.length})" style="font-size:11px;padding:7px 10px;border-radius:8px;border:1px solid rgba(244,63,94,.5);background:rgba(244,63,94,.14);color:#f43f5e;font-weight:800;cursor:pointer;position:relative;z-index:2">${delLbl}</button>
          </div>
        </div>
        <div class="team-fold-body" style="display:none">${membersHtml}</div>
      </div>`;
    }).join('');

    if(uncategorised.length){
      html += `
      <div style="font-size:12px;font-weight:800;color:#f97316;letter-spacing:.5px;margin:18px 0 8px">
        ❓ UNCATEGORISED <span style="color:#64748b;font-weight:600">(${uncategorised.length})</span>
      </div>
      <div class="card" style="margin-bottom:12px;padding:0;overflow:hidden;border-color:rgba(249,115,22,.3)">
        ${uncategorised.map(([memKey,mem])=>`
          <div style="padding:10px 12px;border-top:1px solid var(--border2);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div style="flex:1;min-width:120px">
              <div style="font-size:13px;font-weight:700;color:var(--text)">👤 ${String(mem.name||'').replace(/</g,'')}</div>
              <div style="font-size:11px;color:#64748b">📱 ${mem.mobile||mem.phone||memKey} · 🏢 ${mem.company||'—'}</div>
            </div>
            ${_mobileStatusBadge(mem)}
            ${_mobileActionButtons(memKey,mem.name,mem.status)}
          </div>`).join('')}
      </div>`;
    }

    el.innerHTML = html;
  }).catch(err=>{
    console.error('[renderAdminTeamHierarchy]', err);
    el.innerHTML = '<div class="empty-text" style="padding:12px;color:#f43f5e">Failed to load managers</div>';
  });
}


function _mobileStatusBadge(u){
  const map={approved:['#22c55e','Active'],revoked:['#f43f5e','Revoked'],pending:['#f97316','Pending']};
  const [color,label]=map[u.status]||['#64748b',u.status||'—'];
  let extra='';
  if(u.status==='approved'&&u.validTill){
    const daysLeft=Math.ceil((new Date(u.validTill)-new Date())/86400000);
    extra=daysLeft>=0?` · ${daysLeft}d left`:' · Expired';
  }
  return `<span style="font-size:10px;background:${color}22;color:${color};padding:3px 7px;border-radius:5px;font-weight:700;white-space:nowrap">${label}${extra}</span>`;
}

function _mobileActionButtons(key,name,status){
  const safeName=String(name||'').replace(/'/g,"\'");
  const safeKey=String(key||'').replace(/'/g,"\'");
  const delBtn = `<button type="button" onclick="event.stopPropagation();confirmDeleteMobileUser('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(244,63,94,.45);background:rgba(244,63,94,.12);color:#f43f5e;font-weight:800;cursor:pointer;white-space:nowrap">🗑️ Delete</button>`;
  if(status==='revoked'){
    return `<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
      <button onclick="adminRestoreMobileUser('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.08);color:#22c55e;font-weight:700;cursor:pointer;white-space:nowrap">↺ Restore</button>
      ${delBtn}
    </div>`;
  }
  if(status==='approved' || status==='pending'){
    return `<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
      <button onclick="openAdminSetExpiryModal('${safeKey}','${safeName}',false)" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(96,165,250,.3);background:rgba(96,165,250,.08);color:#60a5fa;font-weight:700;cursor:pointer;white-space:nowrap">📅 Expiry</button>
      <button onclick="adminExtendMobileValidity('${safeKey}','${safeName}',30)" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(56,189,248,.3);background:rgba(56,189,248,.08);color:#38bdf8;font-weight:700;cursor:pointer;white-space:nowrap">+30d</button>
      <button onclick="adminRevokeMobileUser('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.08);color:#f43f5e;font-weight:700;cursor:pointer;white-space:nowrap">🚫 Revoke</button>
      ${delBtn}
    </div>`;
  }
  // Any other status (left, removed, etc.) — still allow hard delete for fresh login
  return `<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${delBtn}</div>`;
}

/** Admin: confirm + permanently delete one mobile user (fresh login next time) */
function confirmDeleteMobileUser(mobileKey, name){
  if(!isAdmin()){ toast(L('❌ Admin only','❌ Admin only')); return; }
  const title = L('🗑️ User Delete','🗑️ Delete user');
  const msg = L(
    '<b>'+(name||mobileKey||'')+'</b> को पूरी तरह delete करें?<br><br>Mobile registration हट जाएगी — अगली बार <b>fresh person</b> की तरह login होगा।',
    'Permanently delete <b>'+(name||mobileKey||'')+'</b>?<br><br>Mobile registration will be removed — next login will be treated as a <b>fresh</b> user.'
  );
  if(typeof confirmModal==='function'){
    confirmModal(title, msg, L('🗑️ हाँ, Delete','🗑️ Yes, Delete'), L('रद्द करें','Cancel')).then(ok=>{
      if(ok) deleteMobileUserCompletely(mobileKey, name);
    });
    return;
  }
  if(!confirm(String(msg).replace(/<[^>]+>/g,' '))) return;
  deleteMobileUserCompletely(mobileKey, name);
}

async function deleteMobileUserCompletely(mobileKey, name){
  if(!isAdmin()){ toast(L('❌ Admin only','❌ Admin only')); return; }
  try{
    toast(L('⏳ Deleting…','⏳ Deleting…'));
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){
        toast(L('❌ Phone OTP verify करें — फिर Delete दबाएँ','❌ Verify phone OTP — then press Delete'));
        return;
      }
    }
    try{ if(typeof _syncAuthRoleNodes==='function') await _syncAuthRoleNodes(); }catch(e){}

    const data = await fbGet('mobileUsers') || {};
    const mk = (typeof _normMobileKey==='function') ? _normMobileKey(mobileKey) : String(mobileKey||'').replace(/\D/g,'').slice(-10);
    const toDelete = new Set();
    Object.keys(data).forEach(k=>{
      const keyN = (typeof _normMobileKey==='function') ? _normMobileKey(k) : String(k||'').replace(/\D/g,'').slice(-10);
      if(k===mobileKey || keyN===mk) toDelete.add(k);
    });
    if(!toDelete.size && mobileKey) toDelete.add(mobileKey);

    // Linked employee roster rows by same phone
    const empKeys = [];
    try{
      const emps = await fbGet('employees') || {};
      Object.entries(emps).forEach(([id,e])=>{
        if(!e) return;
        const em = (typeof _normMobileKey==='function')
          ? _normMobileKey(e.phone||e.mobile||'')
          : String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10);
        if(em && em===mk) empKeys.push(id);
      });
    }catch(e){}

    const extraPaths = [];
    for(const k of toDelete){
      const n = (typeof _normMobileKey==='function') ? _normMobileKey(k) : String(k||'').replace(/\D/g,'').slice(-10);
      if(n && n.length===10){
        extraPaths.push('deviceApprovals/'+n);
        extraPaths.push('pendingMembers/'+n);
        extraPaths.push('userNotifications/'+n);
        extraPaths.push('mobileUsers/'+n);
      }
      extraPaths.push('mobileUsers/'+k);
    }

    let ok=0, fail=0;
    try{
      if(typeof fbUpdate==='function'){
        const patch = {};
        toDelete.forEach(k=>{ patch['mobileUsers/'+k] = null; });
        empKeys.forEach(id=>{ patch['employees/'+id] = null; });
        extraPaths.forEach(path=>{ patch[path] = null; });
        await fbUpdate('/', patch);
        ok = toDelete.size || 1;
      } else {
        throw new Error('no multipath');
      }
    }catch(multiErr){
      for(const k of toDelete){
        try{
          if(typeof fbRemove==='function') await fbRemove('mobileUsers/'+k);
          else await fbSet('mobileUsers/'+k, null);
          ok++;
        }catch(e){
          try{
            await fbUpdate('mobileUsers/'+k, {
              status:'removed', role:'removed',
              removedAt:new Date().toISOString(), removedBy:SESSION.name||'admin',
              forceFreshLogin:true
            });
            ok++;
          }catch(e2){ fail++; }
        }
      }
      for(const id of empKeys){
        try{
          if(typeof fbRemove==='function') await fbRemove('employees/'+id);
          else await fbSet('employees/'+id, null);
        }catch(e){}
      }
      for(const path of extraPaths){
        try{
          if(typeof fbRemove==='function') await fbRemove(path);
          else await fbSet(path, null);
        }catch(e){}
      }
    }

    try{
      if(_cache && _cache.mobileUsers){
        toDelete.forEach(k=>{ try{ delete _cache.mobileUsers[k]; }catch(e){} });
      }
    }catch(e){}

    if(ok && !fail){
      toast(L('✅ ','✅ ')+(name||mk||'User')+L(' हटाया — अगली बार fresh login',' removed — next login is fresh'));
    } else if(ok){
      toast(L('⚠️ आंशिक delete','⚠️ Partial delete'));
    } else {
      toast(L('❌ Delete failed — Admin phone OTP से login करें / rules deploy करें','❌ Delete failed — use Admin phone OTP / deploy rules'));
    }
    try{ renderAdminTeamHierarchy(); }catch(e){}
  }catch(err){
    console.error(err);
    toast(L('❌ Delete failed: ','❌ Delete failed: ')+(err.message||err));
  }
}

async function adminRevokeMobileUser(mobile,name){
  const ok=await confirmModal('Access Revoke करें?',`<b>${name}</b> की App access revoke होगी। वो login नहीं कर पाएंगे।`,'🚫 हाँ, Revoke करें','रद्द करें');
  if(!ok) return;
  try{
    await fbUpdate('mobileUsers/'+mobile,{status:'revoked',revokedBy:SESSION.name,revokedAt:new Date().toISOString()});
    toast('🚫 '+name+L(' की access revoke कर दी',' access revoked'));
    renderAdminTeamHierarchy();
  }catch(e){ toast('❌ Error: '+e.message); }
}

async function adminRestoreMobileUser(mobile,name){
  try{
    await fbUpdate('mobileUsers/'+mobile,{status:'approved',restoredBy:SESSION.name,restoredAt:new Date().toISOString()});
    toast('✅ '+name+L(' की access restore हो गई',' access restored'));
    renderAdminTeamHierarchy();
  }catch(e){ toast('❌ Error: '+e.message); }
}

async function adminExtendMobileValidity(mobile,name,days){
  try{
    const rec=await fbGet('mobileUsers/'+mobile).catch(()=>null);
    const base=rec&&rec.validTill&&new Date(rec.validTill)>new Date()?new Date(rec.validTill):new Date();
    const newExp=new Date(base.getTime()+days*86400000);
    await fbUpdate('mobileUsers/'+mobile,{validTill:newExp.toISOString(),extendedBy:SESSION.name,extendedAt:new Date().toISOString()});
    // Also deviceApprovals if we can resolve emp
    try{
      const empObjId = (rec&&rec.empObjId)||'';
      if(empObjId) await fbUpdate('deviceApprovals/'+empObjId,{ validTill:newExp.toISOString(), extendedBy:SESSION.name, extendedAt:new Date().toISOString() });
    }catch(e2){}
    toast('✅ '+name+L(' की expiry ',' expiry extended by ')+days+L(' दिन बढ़ाई → ',' days → ')+newExp.toLocaleDateString('en-IN'));
    renderAdminTeamHierarchy();
  }catch(e){ toast('❌ Error: '+e.message); }
}

/** Admin: set exact expiry date for one mobile user OR all members under a manager */
function openAdminSetExpiryModal(key, name, bulkForManager){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  const safeKey = String(key||'');
  const defaultDate = new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  const title = bulkForManager
    ? ('📅 All members under '+name+' — set Expiry')
    : ('📅 Set Expiry — '+name);
  const sub = bulkForManager
    ? 'This Manager की पूरी team के members की app expiry date एक साथ बदलें।'
    : 'इस user की app access expiry date set करें।';
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">${escHtml(title)}</div>
  <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">${sub}</div>
  <div class="field"><label>Expiry date</label>
    <input type="date" class="inp-field" id="adm_exp_date" value="${defaultDate}">
  </div>
  <div class="field"><label>या days जोड़ें (optional quick)</label>
    <select class="inp-field" id="adm_exp_days" onchange="(function(s){var d=new Date();d.setDate(d.getDate()+parseInt(s.value||365,10));var el=document.getElementById('adm_exp_date');if(el)el.value=d.toISOString().slice(0,10);})(this)">
      <option value="30">+30 days</option>
      <option value="90">+90 days</option>
      <option value="180">+180 days</option>
      <option value="365" selected>+365 days (1 year)</option>
      <option value="730">+730 days (2 years)</option>
    </select>
  </div>
  <button class="submit-btn" onclick="adminApplyExpiryDate('${safeKey.replace(/'/g,"\'")}','${String(name||'').replace(/'/g,"\'")}',${bulkForManager?'true':'false'})">💾 Save Expiry</button>
  <button class="cancel-btn" onclick="closeModal()">Cancel</button>`);
}

async function adminApplyExpiryDate(key, name, bulkForManager){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  const dateStr = (document.getElementById('adm_exp_date')||{}).value;
  if(!dateStr){ toast(L('⚠️ Date चुनें','⚠️ Select date')); return; }
  const d = new Date(dateStr);
  if(isNaN(d.getTime())){ toast('⚠️ Invalid date'); return; }
  d.setHours(23,59,59,999);
  const validTill = d.toISOString();
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(L('❌ Phone/auth verify करें','❌ Verify phone/auth')); return; }
    }
  }catch(e){}

  if(!bulkForManager){
    try{
      await fbUpdate('mobileUsers/'+key, {
        validTill,
        extendedBy: SESSION.name||'admin',
        extendedAt: new Date().toISOString()
      });
      const rec = await fbGet('mobileUsers/'+key).catch(()=>null);
      const empObjId = (rec && rec.empObjId) || '';
      if(empObjId){
        await fbUpdate('deviceApprovals/'+empObjId, {
          validTill,
          extendedBy: SESSION.name||'admin',
          extendedAt: new Date().toISOString()
        });
      }
      // Try match employee by phone
      try{
        const emp = (getEmps()||[]).find(e=>_normMobileKey(e.phone||e.mobile||'')===_normMobileKey(key));
        if(emp && emp.id) await fbUpdate('deviceApprovals/'+emp.id, { validTill, extendedBy: SESSION.name||'admin', extendedAt: new Date().toISOString() });
      }catch(e2){}
      closeModal();
      toast('✅ '+name+' expiry → '+d.toLocaleDateString('en-IN'));
      try{ renderAdminTeamHierarchy(); }catch(e){}
      try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
    }catch(err){
      toast('❌ '+ (err.message||err));
    }
    return;
  }

  // Bulk: all members under this manager key
  try{
    const allMu = await fbGet('mobileUsers') || {};
    const mk = _normMobileKey(key);
    const targets = Object.entries(allMu).filter(([k,v])=>{
      if(!v || v.role!=='member') return false;
      if(v.status==='rejected' || v.status==='left_team') return false;
      const mid = _normMobileKey(v.managerId||'');
      return mid === mk || v.managerId === key;
    });
    if(!targets.length){ toast(L('⚠️ इस Manager के under कोई member नहीं','⚠️ No members under this Manager')); return; }
    let okN = 0, failN = 0;
    for(const [memKey, mem] of targets){
      try{
        await fbUpdate('mobileUsers/'+memKey, {
          validTill,
          extendedBy: SESSION.name||'admin',
          extendedAt: new Date().toISOString(),
          bulkExpiryFromManager: key
        });
        const empObjId = mem.empObjId || '';
        if(empObjId){
          await fbUpdate('deviceApprovals/'+empObjId, {
            validTill,
            extendedBy: SESSION.name||'admin',
            extendedAt: new Date().toISOString()
          });
        }
        try{
          const emp = (getEmps()||[]).find(e=>_normMobileKey(e.phone||e.mobile||'')===_normMobileKey(memKey));
          if(emp && emp.id) await fbUpdate('deviceApprovals/'+emp.id, { validTill, extendedBy: SESSION.name||'admin', extendedAt: new Date().toISOString() });
        }catch(e2){}
        okN++;
      }catch(e){ failN++; }
    }
    closeModal();
    toast('✅ '+okN+' members expiry → '+d.toLocaleDateString('en-IN')+(failN?' · ❌ '+failN+' failed':''));
    try{ renderAdminTeamHierarchy(); }catch(e){}
    try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
  }catch(err){
    toast('❌ Bulk failed: '+(err.message||err));
  }
}

/** From Team member card — Admin sets expiry by employee id */
function openTeamMemberExpiryModal(empId, empName){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  const emp = (getEmps()||[]).find(e=>e.id===empId);
  const mob = emp ? _normMobileKey(emp.phone||emp.mobile||'') : '';
  if(mob){
    openAdminSetExpiryModal(mob, empName||emp?.name||'', false);
    return;
  }
  // No mobile — still set deviceApprovals
  const defaultDate = new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">📅 Set Expiry — ${escHtml(empName||'')}</div>
  <div class="field"><label>Expiry date</label>
    <input type="date" class="inp-field" id="adm_exp_date" value="${defaultDate}">
  </div>
  <button class="submit-btn" onclick="(async()=>{const ds=(document.getElementById('adm_exp_date')||{}).value;if(!ds){toast(L('Date चुनें','Select date'));return;}const ok=await extendUserExpiry('${empId}',ds);if(ok){closeModal();try{renderTeam();}catch(e){}}})()">💾 Save</button>
  <button class="cancel-btn" onclick="closeModal()">Cancel</button>`);
}



// ── Login Request Approval (new flow) ──
async function approveLoginRequest(reqKey, empObjId, deviceId, empName){
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast('❌ Login/auth required — try again'); return; }
    }
    // Get login request data to fetch selfieUrl and phone
    let selfieUrl = '';
    let phone = '';
    try{
      const req = await fbGet('loginRequests/'+reqKey);
      selfieUrl = req?.selfieUrl || '';
      phone = req?.phone || '';
    }catch(e2){}

    await fbUpdate('loginRequests/'+reqKey, {
      status:'approved', approvedBy:SESSION.name, approvedAt:new Date().toISOString()
    });
    if(empObjId && deviceId){
      await fbUpdate('deviceApprovals/'+empObjId,{
        approvedDeviceId:deviceId, approvedAt:new Date().toISOString(),
        validTill:new Date(Date.now()+365*86400000).toISOString(),
        empName, approvedBy:SESSION.name
      });
    }
    // Save selfie photo to employee record so it shows in team section
    if(empObjId && selfieUrl){
      try{ await fbUpdate('employees/'+empObjId, { photo: selfieUrl }); }catch(e2){}
    }
    // Save phone number to employee record so WhatsApp notifications work
    if(empObjId && phone && phone.length === 10){
      try{ await fbUpdate('employees/'+empObjId, { phone: phone }); }catch(e2){}
    }
    toast('✅ '+empName+' ka login approve ho gaya!');
    renderPending();
  }catch(e){
    toast('❌ Error: '+e.message);
  }
}

async function rejectLoginRequest(reqKey, empName){
  try{
    if(typeof _ensureWriteAuth==='function'){ const ok=await _ensureWriteAuth(); if(!ok){ toast('❌ Auth required'); return; } }
    await fbUpdate('loginRequests/'+reqKey, {
      status:'rejected', rejectedBy:SESSION.name, rejectedAt:new Date().toISOString()
    });
    toast('❌ '+empName+' ka login reject kiya gaya');
    renderPending();
  }catch(e){
    toast('❌ Error: '+e.message);
  }
}

function renderPending(){
  try{ if(typeof renderDeviceTransferRequests==='function') renderDeviceTransferRequests(); }catch(e){}
  // Shared pending shell: Admin sees all; Manager sees login/device area but NOT manager-registration list
  try{
    const adminBlock = document.getElementById('adminOnlyPendingBlock');
    if(adminBlock) adminBlock.style.display = (isAdmin() || isMgr()) ? 'block' : 'none';
  }catch(e){}
  try{
    const mgrRegs = document.getElementById('adminMgrRegsBlock');
    if(mgrRegs) mgrRegs.style.display = isAdmin() ? 'block' : 'none';
  }catch(e){}
  try{
    const regTitle = document.querySelector('#pendingRegs');
    // "New registrations" (regRequests) — Admin only
    if(regTitle){
      const wrap = regTitle.previousElementSibling;
      if(wrap && wrap.classList && wrap.classList.contains('pending-group-title')){
        wrap.style.display = isAdmin() ? '' : 'none';
      }
      regTitle.style.display = isAdmin() ? '' : 'none';
    }
  }catch(e){}
  try{
    const teamBlock = document.getElementById('myTeamApprovalsBlock');
    if(teamBlock) teamBlock.style.display = (isMgr() && !isAdmin()) ? 'block' : 'none';
  }catch(e){}
  if(isAdmin()){
    try{ renderManagerApprovals(); }catch(e){}
  }
  // ── Login Requests (Admin; managers only see manager_login_approval for their team) ──
  if(isAdminOrMgr()){
    const lrEl = document.getElementById('pendingLoginRequests');
    fbGet('loginRequests').then(data=>{
      let reqs = data ? Object.entries(data).filter(([k,v])=>v && v.status==='pending') : [];
      // Managers only see their team / phone-matched requests
      if(isMgr() && !isAdmin()){
        reqs = reqs.filter(([k,v])=>{
          if(v.type==='manager_login_approval'){
            return _isMyTeamLoginRequest(v);
          }
          if(v.type==='device_transfer') return false; // handled in deviceTransferRequests for self
          return false; // managers do not see other login types unless admin
        });
      }
      if(!lrEl) return;
      if(!reqs.length){
        lrEl.innerHTML='<div class="empty" style="padding:16px"><div class="empty-text" style="font-size:12px">'+L('👤 कोई Login Request नहीं','👤 No Login Requests')+'</div></div>'; return;
      }
      lrEl.innerHTML = reqs.map(([k,v])=>{
        const isMgrAppr = v.type==='manager_login_approval';
        return `
        <div class="card" style="border-left:3px solid #f97316">
          <div class="card-row">
            <div class="card-ico" style="background:rgba(249,115,22,.15)">&#128241;</div>
            <div class="card-body">
              <div class="card-name">${v.empName||v.phone||'Member'}</div>
              <div class="card-sub">${isMgrAppr?'Manager login approval':('Code: '+(v.empId||'—'))}${v.phone?' · 📱 '+v.phone:''}</div>
              <div class="card-meta">${v.requestedAt?new Date(v.requestedAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN')):''}</div>
              ${isMgrAppr?'<div style="font-size:11px;color:#38bdf8;font-weight:700">Registered member — approve to login without OTP</div>':''}
              ${v.isNewReg?'<div style="font-size:11px;color:#f97316;font-weight:700">&#128100; Newly Registered Employee</div>':''}
              ${v.selfieUrl?`<div style="margin-top:8px;display:flex;align-items:center;gap:8px"><img src="${v.selfieUrl}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid rgba(249,115,22,.5);cursor:pointer" onclick="window.open('${v.selfieUrl}','_blank')"><span style="font-size:11px;color:#94a3b8">📸 Selfie</span></div>`:''}
            </div>
          </div>
          <div class="action-row">
            <button class="act-btn approve" onclick="${isMgrAppr?`approveManagerLoginRequest('${k}')`:`approveLoginRequest('${k}','${v.empObjId||''}','${v.deviceId||''}','${(v.empName||'').replace(/'/g,"\'")}')`}">&#9989; Approve</button>
            <button class="act-btn reject"  onclick="${isMgrAppr?`rejectManagerLoginRequest('${k}')`:`rejectLoginRequest('${k}','${(v.empName||'').replace(/'/g,"\'")}')`}">&#10060; Reject</button>
          </div>
        </div>`;
      }).join('');
    }).catch(()=>{ if(lrEl) lrEl.innerHTML=''; });
  }
  // Shift change requests (members → manager)
  try{ _renderPendingShiftChangeRequests(); }catch(e){}
  // Device change requests
  renderPendingDevices();
  // Registration requests
  const regs=getRegs().filter(r=>r.status==='pending');
  document.getElementById('pendingRegs').innerHTML = regs.length ? regs.map(r=>`
    <div class="card">
      <div class="card-row">
        <div class="card-ico" style="background:${r.isExternal?'rgba(56,189,248,.12)':'var(--daybg)'}">${r.isExternal?(r.companyIco||'🏢'):'👤'}</div>
        <div class="card-body">
          <div class="card-name">${r.name||r.empId}</div>
          <div class="card-sub">Code: ${r.empId} · ${secName(r.sec)||r.dept||''} ${r.phone?'· 📱 '+r.phone:''}</div>
          <div class="card-meta">${new Date(r.requestedAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN'))}</div>
          ${r.selfieUrl?`<div style="margin-top:8px;display:flex;align-items:center;gap:8px"><img src="${r.selfieUrl}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid rgba(249,115,22,.5);cursor:pointer" onclick="window.open('${r.selfieUrl}','_blank')"><span style="font-size:11px;color:#94a3b8">📸 Selfie<br><span style="font-size:10px;color:#64748b">Tap to zoom</span></span></div>`:'<div style="margin-top:6px;font-size:11px;color:#f43f5e">⚠️ कोई Selfie नहीं</div>'}
        </div>
      </div>
      <div class="action-row">
        <button class="act-btn approve" onclick="actReg('${r._key||r.id}','approved')">✅ मंजूर करें</button>
        <button class="act-btn reject"  onclick="actReg('${r._key||r.id}','rejected')">❌ अस्वीकार</button>
      </div>
    </div>`).join('') :
    '<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">कोई नया रजिस्ट्रेशन नहीं</div></div>';

  // Pending leaves
  const leaves=getLeaves().filter(l=>l.status==='pending');
  const _pgLeave=document.getElementById('pendingLeaves');
  if(_pgLeave && !_pgLeave.previousElementSibling?.classList?.contains('pending-group-title')){
    const h=document.createElement('div'); h.className='pending-group-title'; h.textContent='Leave requests';
    _pgLeave.parentNode.insertBefore(h, _pgLeave);
  }
  document.getElementById('pendingLeaves').innerHTML = leaves.length ? leaves.map(l=>`
    <div class="card">
      <div class="card-row">
        <div class="card-ico" style="background:var(--daybg)">📅</div>
        <div class="card-body">
          <div class="card-name">${l.empName}${(()=>{ const c=l.empCode||l.empNo||''; if(c) return ` <span style="font-size:12px;font-weight:700;color:var(--muted2)">· #${escHtml(String(c))}</span>`; const emp=(getEmps()||[]).find(e=>e.id===l.empId||e.empId===l.empId); const code=emp&&emp.empId?emp.empId:''; return code?` <span style="font-size:12px;font-weight:700;color:var(--muted2)">· #${escHtml(String(code))}</span>`:''; })()}</div>
          <div class="card-sub">${l.leaveType} · ${l.days} दिन${l.coffDate?` · <span style="color:#f97316">📅 Shift था: ${l.coffDate}</span>`:''}</div>
          <div class="card-meta">${fmtDate(l.from)}${l.from!==l.to?' → '+fmtDate(l.to):''}</div>
          ${l.reason?`<div style="margin-top:6px;padding:7px 10px;background:var(--card2);border-left:3px solid var(--day);border-radius:0 8px 8px 0;font-size:12px;color:var(--text);font-weight:600">📝 ${escHtml(l.reason)}</div>`:'<div style="margin-top:4px;font-size:11px;color:var(--lv);font-weight:600">⚠️ कारण नहीं दिया गया</div>'}
        </div>
      </div>
      <div class="action-row">
        <button type="button" class="act-btn approve" data-leave-key="${l._key||l.id||''}" onclick="event.stopPropagation();actLeave(this.getAttribute('data-leave-key')||'','approved')">✅ Approve</button>
        <button type="button" class="act-btn reject"  data-leave-key="${l._key||l.id||''}" onclick="event.stopPropagation();actLeave(this.getAttribute('data-leave-key')||'','rejected')">❌ Reject</button>
        <button type="button" class="act-btn edit" data-leave-key="${l._key||l.id||''}" onclick="event.stopPropagation();openEditLeaveForm(this.getAttribute('data-leave-key')||'')">✏️ Edit</button>
        <button type="button" class="act-btn reject" data-leave-key="${l._key||l.id||''}" onclick="event.stopPropagation();deleteLeaveRecord(this.getAttribute('data-leave-key')||'')">🗑️ Delete</button>
      </div>
    </div>`).join('') :
    '<div class="empty"><div class="empty-icon">🌴</div><div class="empty-text">कोई छुट्टी पेंडिंग नहीं</div></div>';

  // Pending reports
  const reports=getReports().filter(r=>r.status==='pending');
  document.getElementById('pendingReports').innerHTML = reports.length ? reports.map(r=>{
    const rt=REPORT_TYPES[r.type]||REPORT_TYPES.ncr;
    return `<div class="card">
      <div class="card-row">
        <div class="card-ico" style="background:${rt.bg}">${rt.ico}</div>
        <div class="card-body">
          <div class="card-name">${r.aboutName}</div>
          <div class="card-sub">${rt.label} · ${fmtDate(r.date)}</div>
          <div class="card-meta">${r.description}</div>
          <div class="card-meta">रिपोर्ट: ${r.reportedByName}</div>
        </div>
      </div>
      <div class="action-row">
        <button class="act-btn approve" onclick="actReport('${r._key}','approved')">✅ मंजूर</button>
        <button class="act-btn reject"  onclick="actReport('${r._key}','rejected')">❌ अस्वीकार</button>
      </div>
    </div>`;
  }).join('') :
  '<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">कोई रिपोर्ट पेंडिंग नहीं</div></div>';

  updatePendingBadge();
}

async function actReg(key, status){
  const regs = getRegs();
  let reg = regs.find(r=>r._key===key||r.id===key);

  // If not in local cache, fetch directly from Firebase
  if(!reg){
    try{
      const snap = await fbGet('regRequests/'+key);
      if(snap) reg = {...snap, _key:key};
    }catch(e){}
  }

  if(status === 'approved'){
    if(!reg){ toast(L('❌ Data नहीं मिला — page refresh करें','❌ Data not found — refresh the page')); return; }
    const displayName = (reg.name && reg.name !== reg.empId) ? reg.name : reg.empId;
    const newId = 'e' + Date.now().toString(36);
    const newEmp = {
      id: newId,
      name: displayName,
      empId: reg.empId,
      sec: reg.sec || reg.dept || 'MET',
      mc: reg.mc || '—',
      resp: 'Operation',
      woff: 'SUN',
      status: 'active',
      phone: reg.phone || '',
      ms: Array(31).fill('D')
    };
    try{
      await fbUpdate('employees/'+newId, newEmp);
    }catch(e){
      toast(L('❌ Employee add नहीं हुआ: ','❌ Could not add employee: ')+e.message); return;
    }
    if(reg.passHash){
      try{ await fbSet('workerPasswords/'+newId, reg.passHash); }catch(e){}
    }
    await fbUpdate('regRequests/'+key, {
      status:'approved',
      actionAt: new Date().toISOString(),
      linkedEmpId: newId,
      approvedBy: SESSION.name || 'admin'
    });
    // In-app notification to new employee
    try{
      await fbPush('userNotifications/'+newId, {
        title: '✅ Registration Approved!',
        body: 'आपका registration approve हो गया। अब login करें।',
        read: false,
        at: new Date().toISOString()
      });
    }catch(e){}
    toast('✅ '+displayName+' ('+reg.empId+') '+L('approved! Team में add हो गए।','approved! Added to team.'));
  } else {
    await fbUpdate('regRequests/'+key, {
      status, actionAt: new Date().toISOString(),
      actionBy: SESSION.name || 'admin'
    });
    toast(L('❌ रजिस्ट्रेशन अस्वीकार किया','❌ Registration rejected'));
  }
  renderPending();
}

