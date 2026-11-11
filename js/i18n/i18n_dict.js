/* Man Power — i18n dictionary + toast helpers
 * Extracted from app-team-excel-ops.js (v5.1.0 module split)
 * Loaded after app-core.js (provides global L if needed) and before heavy team scripts.
 */
// ── i18n TRANSLATION DICTIONARY (Hindi → English) ──
// Used by toast(), confirmModal(), and other dynamic UI text
// Key = original Hindi string, Value = English translation
// Strings with ${...} placeholders use the same placeholders
const _i18n_HI_EN = {
  // ── Validation / Required field errors ──
  'Content नहीं मिला':                       'Content not found',
  'Plan चुनें':                              'Select Plan',
  'Title भरें':                              'Enter Title',
  'URL खाली है':                             'URL is empty',
  'अंतिम दिन चुनें':                         'Select end date',
  'इस कर्मचारी का कोई NCR नहीं है':         'No NCR for this employee',
  'कर्मचारी चुनें':                          'Select Employee',
  'कर्मचारी नहीं मिला':                     'Employee not found',
  'कारण चुनें':                              'Select Reason',
  'कोई बदलाव नहीं है':                       'No changes to save',
  'जल्द आ रहा है! ⏳':                       'Coming soon! ⏳',
  'नाम और link दोनों जरूरी हैं':            'Both name and link are required',
  'नाम और कोड जरूरी है':                    'Name and code required',
  'नाम भरें':                                'Enter Name',
  'पहले plan चुनें':                         'Select a plan first',
  'सभी जानकारी भरें':                       'Fill all details',
  'सही price डालें':                         'Enter valid price',
  'सही मोबाइल नंबर डालें':                  'Enter valid mobile number',

  // ── Warnings (⚠️) ──
  '⏳ ${secs} सेकंड बाद भेजें':              '⏳ Send after ${secs} seconds',
  '☑️ Select Mode ON — cells tap करें, फिर shift चुनें': '☑️ Select Mode ON — tap cells, then choose shift',
  '⚠️ 10MB से छोटी फोटो चुनें':              '⚠️ Pick photo smaller than 10MB',
  '⚠️ API Key खाली है':                      '⚠️ API Key is empty',
  '⚠️ App Validity: सिर्फ ${daysLeft} दिन बाकी! Profile tap करें।': '⚠️ App Validity: Only ${daysLeft} days left! Tap Profile.',
  '⚠️ C-Off के लिए Shift Date जरूरी है':     '⚠️ Shift Date required for C-Off',
  '⚠️ Display error — कृपया page refresh करें': '⚠️ Display error — please refresh the page',
  '⚠️ Duplicate Leave! इन dates पर पहले से application है: ': '⚠️ Duplicate Leave! Application already exists for these dates: ',
  '⚠️ EL Limit पार! Available: ':           '⚠️ EL Limit exceeded! Available: ',
  '⚠️ Leave override — D shift set। Save करने पर लागू होगा।': '⚠️ Leave override — D shift set. Will apply on Save.',
  '⚠️ Schedule Builder open नहीं है':       '⚠️ Schedule Builder not open',
  '⚠️ Title जरूरी है':                       '⚠️ Title required',
  '⚠️ अधिकतम 1 साल (366 दिन) का range चुनें': '⚠️ Maximum range is 1 year (366 days)',
  '⚠️ अधिकतम 5 photos':                     '⚠️ Maximum 5 photos',
  '⚠️ आज ${remaining} OTP और भेज सकते हैं':  '⚠️ ${remaining} OTPs left for today',
  '⚠️ आपकी App access ':                     '⚠️ Your App access ',
  '⚠️ कारण लिखना अनिवार्य है':              '⚠️ Reason is required',
  '⚠️ कृपया दोनों तारीखें चुनें':            '⚠️ Please pick both dates',
  '⚠️ कोई data नहीं':                        '⚠️ No data',
  '⚠️ जानकारी (Details) लिखें':              '⚠️ Enter details',
  '⚠️ पहले API Key डालें':                  '⚠️ Enter API Key first',
  '⚠️ पहले Schedule खोलें':                 '⚠️ Open Schedule first',
  '⚠️ पहले month select करें':               '⚠️ Select month first',
  '⚠️ फोटो 10MB से छोटी होनी चाहिए':         '⚠️ Photo must be smaller than 10MB',
  '⚠️ फोटो बहुत बड़ी है':                    '⚠️ Photo too large',
  '⚠️ फोटो बहुत बड़ी है — कृपया छोटी फोटो लें': '⚠️ Photo too large — please take smaller photo',
  '⚠️ महीना चुनें':                          '⚠️ Select month',
  '⚠️ विषय (Title) लिखें':                   '⚠️ Enter Title',
  '⚠️ शुरू की तारीख अंत से पहले होनी चाहिए': '⚠️ Start date must be before end date',
  '⚠️ सही 10 अंक का नंबर डालें':            '⚠️ Enter valid 10-digit number',

  // ── Success (✅) ──
  '✅ ${cells.length} cells में ${shiftVal} लगाया': '✅ ${shiftVal} applied to ${cells.length} cells',
  '✅ ${name} जोड़ा गया':                    '✅ ${name} added',
  '✅ ${savedEntries.length} बदलाव save हुए': '✅ ${savedEntries.length} changes saved',
  '✅ App install हो रही है...':             '✅ App installing...',
  '✅ App पहले से installed है! Home screen पर देखें।': '✅ App already installed! Check your Home screen.',
  '✅ Button जोड़ दिया गया!':                '✅ Button added!',
  '✅ Content add हो गया!':                  '✅ Content added!',
  '✅ Dedication save हो गई!':              '✅ Dedication saved!',
  '✅ Excel (CSV) file download हो गई!':     '✅ Excel (CSV) file downloaded!',
  '✅ Fingerprint login set up हो गया!':     '✅ Fingerprint login set up!',
  '✅ Login हो गया! Welcome ':               '✅ Logged in! Welcome ',
  '✅ Password set हो गया! अगली बार सीधे login करें': '✅ Password set! Next time login directly',
  '✅ Price update हो गई!':                  '✅ Price updated!',
  '✅ Request भेज दी! Manager approve करेंगे।': '✅ Request sent! Manager will approve.',
  '✅ Request भेज दी! Manager verify करेंगे।': '✅ Request sent! Manager will verify.',
  '✅ Request भेजी! WhatsApp से Admin को notification जाएगी।': '✅ Request sent! Admin will get a WhatsApp notification.',
  '✅ SMS Settings save हो गई':              '✅ SMS Settings saved',
  '✅ Schedule image download हो गई!':       '✅ Schedule image downloaded!',
  '✅ Schedule save हो गई!':                 '✅ Schedule saved!',
  '✅ Shift schedule upload हो गया!':        '✅ Shift schedule uploaded!',
  '✅ UPI ID Copy हो गई!':                   '✅ UPI ID copied!',
  '✅ अनलॉक हो गया':                         '✅ Unlocked',
  '✅ काम जोड़ा गया!':                       '✅ Task added!',
  '✅ क्रम & Group save हो गया! Schedule update हो रही है...': '✅ Order & Group saved! Updating schedule...',
  '✅ छुट्टी आवेदन भेज दिया गया!':            '✅ Leave application sent!',
  '✅ छुट्टी मंजूर! शेड्यूल अपडेट हो गया':   '✅ Leave approved! Schedule updated',
  '✅ जानकारी अपडेट हो गई':                  '✅ Information updated',
  '✅ डेटा initialize हो गया':               '✅ Data initialized',
  '✅ निर्देश सहेज लिए गए!':                 '✅ Instructions saved!',
  '✅ रिपोर्ट भेज दी गई!':                   '✅ Report sent!',

  // ── Errors (❌) ──
  '❌ 6-digit OTP डालें':                    '❌ Enter 6-digit OTP',
  '❌ Data नहीं मिला':                       '❌ Data not found',
  '❌ Data नहीं मिला — page refresh करें':   '❌ Data not found — please refresh',
  '❌ Department / Machine चुनें':           '❌ Select Department / Machine',
  '❌ Employee add नहीं हुआ: ':              '❌ Employee not added: ',
  '❌ Manager section की editing सिर्फ Admin कर सकता है': '❌ Only Admin can edit Manager section',
  '❌ Manager section में सिर्फ Admin जोड़ सकते हैं':     '❌ Only Admin can add to Manager section',
  '❌ Password कम से कम 5 characters होना चाहिए':         '❌ Password must be at least 5 characters',
  '❌ Permission नहीं है':                   '❌ No permission',
  '❌ Record नहीं मिला':                     '❌ Record not found',
  '❌ आज की OTP limit पूरी हो गई। कल try करें।': '❌ Today\'s OTP limit reached. Try tomorrow.',
  '❌ कम से कम एक section चुनें':           '❌ Select at least one section',
  '❌ काम का नाम डालें':                     '❌ Enter task name',
  '❌ कोई data नहीं है':                     '❌ No data available',
  '❌ कोई match नहीं':                       '❌ No match',
  '❌ गलत Key':                              '❌ Wrong Key',
  '❌ छुट्टी अस्वीकार की गई':                '❌ Leave rejected',
  '❌ रजिस्ट्रेशन अस्वीकार किया':            '❌ Registration rejected',
  '❌ सिर्फ Admin/Manager export कर सकते हैं': '❌ Only Admin/Manager can export',
  '❌ सिर्फ Admin/Manager कर सकते हैं':       '❌ Only Admin/Manager can do this',

  // ── Misc emojis ──
  '🎉 App install हो गई! Home screen पर देखें': '🎉 App installed! Check Home screen',
  '👆 Fingerprint से login हो गया!':         '👆 Logged in via Fingerprint!',
  '📝 Resignation request भेज दी गई!':       '📝 Resignation request sent!',
  '📢 Information पोस्ट हो गई!':            '📢 Information posted!',
  '📤 CSV export हो गई!':                    '📤 CSV exported!',
  '📲 ${waQueue.length} कर्मचारियों को WhatsApp भेजना है': '📲 WhatsApp to be sent to ${waQueue.length} employees',
  '📲 ${escHtml(waQueue[0].emp.name)} को WhatsApp भेजा': '📲 WhatsApp sent to ${escHtml(waQueue[0].emp.name)}',
  '📸 Image बन रही है... रुकिए':            '📸 Generating image... please wait',
  '🔄 Default order restore हो गया':         '🔄 Default order restored',
  '🔄 Original shift restore हो गई':         '🔄 Original shift restored',
  '🔄 Practice reset — फिर से शुरू करें!':  '🔄 Practice reset — start again!',
  '🔄 दोबारा Login करें':                    '🔄 Please login again',
  '🔄 नया version मिला — refresh हो रहा है...': '🔄 New version available — refreshing...',
  '🔑 Password हटाया गया — Employee Code से दोबारा verify करें': '🔑 Password removed — verify again with Employee Code',
  '🗑️ Button हटा दिया':                      '🗑️ Button removed',
  '🗑️ Content हटा दिया':                     '🗑️ Content removed',
  '🗑️ Delete हो गया':                        '🗑️ Deleted',
  '🗑️ Report delete हो गई':                  '🗑️ Report deleted',
  '🗑️ सभी बदलाव रद्द किए गए':                '🗑️ All changes cancelled',
  '🚪 Logout हो रहा है...':                  '🚪 Logging out...',

  // ── confirmModal titles ──
  '${n} बदलाव Unsaved हैं!':                 '${n} Unsaved changes!',
  '${uncheckedItems.length} Items Incomplete हैं': '${uncheckedItems.length} Items Incomplete',
  'Access Revoke करें?':                     'Revoke Access?',
  'Default पर वापस जाएं?':                   'Reset to Default?',
  'Device हटाएं?':                           'Remove Device?',
  'Report Delete करें?':                     'Delete Report?',
  'Resignation Reject करें?':                'Reject Resignation?',
  'काम Delete करें?':                        'Delete Task?',

  // ── Modal titles ──
  '${editId?\'✏️ काम Edit करें\':\'➕ नया काम जोड़ें\'}': '${editId?\'✏️ Edit Task\':\'➕ Add New Task\'}',
  '${name} का डेटा हमेशा के लिए हटाएं?':     'Delete ${name}\'s data permanently?',
  '${name} को टीम से हटाएं?':                'Remove ${name} from team?',
  '⏳ Access Extend करें':                   '⏳ Extend Access',
  '✏️ ${escHtml(e.name)} संपादित करें':               '✏️ Edit ${escHtml(e.name)}',
  '✏️ Shift चुनें':                          '✏️ Select Shift',
  '✏️ निर्देश संपादित करें':                  '✏️ Edit Instructions',
  '➕ Content Add करें':                      '➕ Add Content',
  '🌴 Leave का कारण':                        '🌴 Leave Reason',
  '🌴 छुट्टी आवेदन':                         '🌴 Leave Application',
  '👁️ Preview — Save करने से पहले देखें':    '👁️ Preview — Review before saving',
  '👤 नया कर्मचारी':                         '👤 New Employee',
  '📋 रिपोर्ट दर्ज करें':                    '📋 File Report',
  '📤 Excel से Shift Schedule अपलोड करें':   '📤 Upload Shift Schedule from Excel',
  '📤 Excel से Team Data Update करें':       '📤 Update Team Data from Excel',
  '📤 कर्मचारी List Upload करें':            '📤 Upload Employee List',
  '📲 App Install करें':                     '📲 Install App',
  '📲 iPhone पर Install करें':               '📲 Install on iPhone',
  '🔗 Quick Links Manage करें':              '🔗 Manage Quick Links',
  '🗓️ कस्टम तारीख सीमा':                     '🗓️ Custom Date Range',

    '30 दिन': '30 days',
  '3 महीने': '3 months',
  '6 महीने': '6 months',
  '1 साल': '1 year',
  'लागू करें': 'Apply',
// ── PHASE 3: Buttons (action labels) ──
  '&larr; वापस जाएं':                        '&larr; Back',
  '+ नई रिपोर्ट दर्ज करें':                  '+ File New Report',
  '+ नया अवकाश आवेदन':                       '+ New Leave Application',
  '+ नया कर्मचारी जोड़ें':                   '+ Add New Employee',
  '+ नियम जोड़ें':                           '+ Add Rule',
  'अभी नहीं → सीधे Login करें':             'Not now → Login directly',
  'आगे बढ़ें →':                             'Continue →',
  'ठीक है':                                  'OK',
  'बंद करें':                                'Close',
  'बाद में':                                 'Later',
  'रद्द':                                    'Cancel',
  'रद्द करें':                               'Cancel',
  'रहने दो — Leave रखो':                    'Keep — leave as is',
  'हाँ, हमेशा के लिए हटाएं':                'Yes, delete permanently',
  '← बदलें':                                 '← Change',
  '← वापस':                                  '← Back',
  '← वापस जाएं':                             '← Back',
  '↕️ क्रम बदलें':                          '↕️ Reorder',
  '↩️ वापस':                                 '↩️ Back',
  '⏳ Pending Approvals देखें':               '⏳ View Pending Approvals',
  '⚠️ फिर भी बदलें (Leave हटेगी)':           '⚠️ Change anyway (Leave will be removed)',
  '✅ Accept करें':                          '✅ Accept',
  '✅ Add करें':                              '✅ Add',
  '✅ Button जोड़ें':                         '✅ Add Button',
  '✅ C-Off Mark करें':                       '✅ Mark C-Off',
  '✅ Confirm करें — Firebase में Save':      '✅ Confirm — Save to Firebase',
  '✅ Extend करें':                           '✅ Extend',
  '✅ Leave Mark करें':                       '✅ Mark Leave',
  '✅ OD Mark करें':                          '✅ Mark OD',
  '✅ Password Save करें':                   '✅ Save Password',
  '✅ Verify करके Login Request भेजें':      '✅ Verify & Send Login Request',
  '✅ Verify करें':                          '✅ Verify',
  '✅ जोड़ें':                                '✅ Add',
  '✅ मंजूर':                                '✅ Approve',
  '✅ मंजूर करें':                           '✅ Approve',
  '✅ मैंने Pay कर दिया':                    '✅ I have paid',
  '✅ लागू करें':                             '✅ Apply',
  '✅ हाँ, हटाएं':                            '✅ Yes, Delete',
  '✏️ निर्देश संपादित करें':                  '✏️ Edit Instructions',
  '✓ सब पढ़ा':                              '✓ Mark All Read',
  '✕ रद्द करें':                             '✕ Cancel',
  '✕ रद्द करें · Cancel':                    '✕ Cancel',
  '❌ Reject करें':                          '❌ Reject',
  '❌ अस्वीकार':                              '❌ Reject',
  '➕ इस Module में Content Add करें':       '➕ Add Content to this Module',
  '➕ नया Content Add करें':                 '➕ Add New Content',
  '➕ नया Section जोड़ें':                   '➕ Add New Section',
  '🎉 Holiday काम किया':                     '🎉 Worked on Holiday',
  '👁 दिखाएं':                                '👁 Show',
  '👆 हाँ, Setup करें':                       '👆 Yes, Set up',
  '👍 बंद करें':                              '👍 Close',
  '💳 अभी Pay करें':                          '💳 Pay Now',
  '💾 Save करें':                             '💾 Save',
  '💾 Settings Save करें':                    '💾 Save Settings',
  '💾 सहेजें (Save)':                         '💾 Save',
  '💾 सेव करें':                              '💾 Save',
  '📋 Schedule खोलें':                       '📋 Open Schedule',
  '📋 Schedule बनाएं':                       '📋 Create Schedule',
  '📞 Manager को Call करें':                   '📞 Call Manager',
  '📢 पोस्ट करें':                           '📢 Post',
  '📤 Approval Request भेजें':                '📤 Send Approval Request',
  '📤 OTP भेजें':                            '📤 Send OTP',
  '📤 Resignation भेजें':                    '📤 Send Resignation',
  '📤 आवेदन भेजें':                          '📤 Send Application',
  '📤 रिपोर्ट भेजें':                        '📤 Send Report',
  '📲 Submit &rarr; WhatsApp से Admin को जाएगी': '📲 Submit &rarr; Will go to Admin via WhatsApp',
  '📷 Selfie लें / बदलें':                  '📷 Take / Change Selfie',
  '📸 Camera से खींचें':                     '📸 Take with Camera',
  '📸 Camera से लें':                         '📸 Take with Camera',
  '🔄 OTP दोबारा भेजें':                    '🔄 Resend OTP',
  '🔄 Original पर Reset करें':                '🔄 Reset to Original',
  '🔄 दूसरे Account से Login करें':          '🔄 Login with Different Account',
  '🔄 दोबारा Practice करें':                 '🔄 Practice Again',
  '🔍 Tampering Log देखें':                  '🔍 View Tampering Log',
  '🔐 Login करें':                            '🔐 Login',
  '🔑 Password भूल गए? Employee Code से दोबारा verify करें': '🔑 Forgot Password? Verify again with Employee Code',
  '🔓 Login करें':                            '🔓 Login',
  '🔓 अनलॉक करें':                            '🔓 Unlock',
  '🔔 W-Off पर बुलाया':                      '🔔 Called on W-Off',
  '🖨️ प्रिंट करें':                           '🖨️ Print',
  '🖨️ प्रिंट':                                '🖨️ Print',
  '🖼️ Gallery से चुनें':                     '🖼️ Pick from Gallery',
  '🗓️ कस्टम तारीख चुनें':                    '🗓️ Pick Custom Date',
  '🤖 Auto बनाएं':                            '🤖 Auto Generate',
  '🧪 Test SMS भेजें':                        '🧪 Send Test SMS',

  // ── PHASE 3: Static labels (≤30 chars) ──
  '(31 दिन की सीमा)':                        '(31 day limit)',
  '(आप)':                                    '(You)',
  'Access validity समाप्त हो गई':                       '45 days completed',
  '6-digit OTP डालें *':                     'Enter 6-digit OTP *',
  'Admin contact करें':                      'Contact Admin',
  'Admin जल्द add करेंगे':                  'Admin will add soon',
  'Admin हैं?':                               'Are you Admin?',
  'App Install करें':                         'Install App',
  'Approval का इंतजार है':                  'Waiting for Approval',
  'Approved Leave है!':                       'Approved Leave exists!',
  'Department / Machine का नाम':              'Department / Machine name',
  'Duration (जैसे: 12 min)':                  'Duration (e.g. 12 min)',
  'Employee Code डालें':                     'Enter Employee Code',
  'Excel Expert लोड हो रहा है...':           'Loading Excel Expert...',
  'File चुनें या यहाँ Drop करें':            'Pick File or Drop here',
  'Fingerprint Login Setup करें?':            'Set up Fingerprint Login?',
  'MetCost Pro लोड हो रहा है...':            'Loading MetCost Pro...',
  'Month चुनें':                             'Select Month',
  'Monthly Salary देख सकें':                 'Can view Monthly Salary',
  'PASSWORD डालें *':                        'Enter PASSWORD *',
  'PASSWORD दोबारा डालें *':                 'Re-enter PASSWORD *',
  'Password बनाएं':                          'Create Password',
  'Password से login करें →':                'Login with Password →',
  'Price Edit करें':                          'Edit Price',
  'Print — Section चुनें':                  'Print — Select Section',
  'Resignation / त्यागपत्र':                 'Resignation',
  'Resignation का कारण':                     'Reason for Resignation',
  'SMS Notifications चालू रखें':            'Keep SMS Notifications on',
  'Seniors (एक लाइन में एक नाम)':           'Seniors (one name per line)',
  'SupSkill लोड हो रहा है...':               'Loading SupSkill...',
  'Test के लिए मोबाइल नंबर':                 'Mobile number for Test',
  'Time Study लोड हो रहा है...':             'Loading Time Study...',
  'Title (नाम)':                              'Title (Name)',
  'Update होंगे':                             'Will be updated',
  'Validity बढ़ाएं':                         'Extend Validity',
  'Verify करें':                              'Verify',
  'Video जल्द upload होगा':                  'Video will be uploaded soon',
  'अंत की तारीख (Date B)':                  'End Date (Date B)',
  'अगले 15 दिन':                             'Next 15 days',
  'अनुमोदन पेंडिंग':                         'Approval Pending',
  'अपना fingerprint लगाएं':                  'Place your fingerprint',
  'अपना कर्मचारी कोड type करें':            'Type your employee code',
  'अभी कोई button नहीं है':                 'No buttons yet',
  'अवकाश (Leaves)':                          'Leaves',
  'आज':                                      'Today',
  'आज का रोस्टर':                            "Today's Roster",
  'आज की स्थिति — विभाग वार':              "Today's Status — Section Wise",
  'आप':                                      'You',
  'आपकी Progress':                            'Your Progress',
  'ऊपर Month चुनें':                         'Select Month above',
  'कर्मचारी':                                'Employee',
  'कर्मचारी का नाम':                         'Employee Name',
  'कर्मचारी क्रम व Group बदलें':            'Reorder Employees & Groups',
  'कल':                                      'Yesterday',
  'काम का नाम (Title) *':                   'Task Name (Title) *',
  'कारण (Reason)':                            'Reason',
  'कारण * (अनिवार्य)':                       'Reason * (required)',
  'कारण / Reason *':                          'Reason *',
  'कारण लिखें':                              'Write reason',
  'कार्य सूची — Task List':                  'Task List',
  'कितने दिन के लिए?':                       'For how many days?',
  'किसके लिए (Assign To)':                   'Assign To',
  'किसी भी device से login करें':            'Login from any device',
  'कुछ समय बाद दोबारा try करें।':            'Please try again later.',
  'कुल':                                     'Total',
  'कुल काम':                                 'Total Tasks',
  'कोई OD रिकॉर्ड नहीं':                    'No OD records',
  'कोई device request नहीं':                  'No device requests',
  'कोई notification नहीं':                    'No notifications',
  'कोई कर्मचारी नहीं मिला':                 'No employees found',
  'कोई छुट्टी आवेदन नहीं':                   'No leave applications',
  'कोई छुट्टी नहीं':                         'No leaves',
  'कोई छुट्टी पेंडिंग नहीं':                'No leaves pending',
  'कोई नया रजिस्ट्रेशन नहीं':                'No new registrations',
  'कोई रिपोर्ट नहीं':                        'No reports',
  'कोई रिपोर्ट पेंडिंग नहीं':                'No reports pending',
  'छुट्टी का प्रकार':                        'Leave Type',
  'जल्द आ रहा है!':                          'Coming soon!',
  'ज़िम्मेदारी':                              'Responsibility',
  'जाने का कारण':                             'Reason for leaving',
  'जो कर्मचारी टीम छोड़ चुके हैं':           'Employees who left the team',
  'टीम':                                     'Team',
  'तक तारीख':                                'To Date',
  'तारीख':                                   'Date',
  'नई कीमत (₹)':                             'New Price (₹)',
  'नए कर्मचारी':                             'New Employees',
  'नया Device Detected':                      'New Device Detected',
  'नया Device Login Request':                 'New Device Login Request',
  'नाम':                                     'Name',
  'पूरा शेड्यूल देखें →':                    'View Full Schedule →',
  'प्रोफाइल नहीं मिली':                       'Profile not found',
  'बाकी है':                                  'Remaining',
  'भुगतान राशि':                             'Payment Amount',
  'मशीन':                                    'Machine',
  'महत्वपूर्ण निर्देश':                      'Important Instructions',
  'महीना चुनें':                             'Select Month',
  'विभाग': 'Department',
  'मेरी छुट्टियाँ':                          'My Leaves',
  'मेरी शिफ्ट':                               'My Shift',
  'यह वापस नहीं होगा!':                      'This cannot be undone!',
  'यहाँ Excel फ़ाइल छोड़ें':                 'Drop Excel file here',
  'रिपोर्ट':                                  'Report',
  'रिपोर्ट का प्रकार':                       'Report Type',
  'रिपोर्ट किसके बारे में':                  'Report About Whom',
  'लोड नहीं हो सका':                          'Could not load',
  'वापसी पर स्वागत है!':                     'Welcome Back!',
  'विवरण (Description)':                      'Description',
  'विवरण (Details)':                          'Details',
  'विवरण / टिप्पणी (Optional)':              'Description / Note (Optional)',
  'शिफ्ट में कमी':                            'Shift Shortage',
  'शुरू की तारीख (Date A)':                  'Start Date (Date A)',
  'संपर्क सूत्र':                             'Contact',
  'सब Select करें':                          'Select All',
  'सभी':                                     'All',
  'सभी sessions साफ़ करें':                  'Clear all sessions',
  'सीखें & Grow करें':                       'Learn & Grow',
  'से तारीख':                                'From Date',
  'विभाग':                                  'Department',
  'स्थिति':                                  'Status',
  'हो गया':                                   'Done',
  '⏳ Access Extend करें':                    '⏳ Extend Access',
  '⏳ जल्द आ रहा है':                         '⏳ Coming Soon',
  '⏳ प्रतीक्षा में':                         '⏳ Waiting',
  '⏳ फ़ाइल पढ़ रहे हैं...':                 '⏳ Reading file...',
  '⏳ फ़ाइल पढ़ी जा रही है...':              '⏳ Reading file...',
  '⏳ बाकी':                                  '⏳ Remaining',
  '⏳ लोड हो रहा है...':                      '⏳ Loading...',
  '⚠️ Salary column नहीं मिला':              '⚠️ Salary column not found',
  '⚠️ कारण नहीं दिया गया':                  '⚠️ No reason given',
  '⚠️ कोई Selfie नहीं':                       '⚠️ No Selfie',
  '⚠️ कोई उपलब्ध Supervisor नहीं':            '⚠️ No Supervisor available',
  '⚠️ यह कार्रवाई अपरिवर्तनीय है':           '⚠️ This action is irreversible',
  '⚡ चेतावनी':                              '⚡ Warning',
  '✅ दर्ज':                                  '✅ Filed',
  '✅ पूरा':                                  '✅ Complete',
  '✓ FREE — सभी के लिए':                     '✓ FREE — for everyone',
  '❌ फ़ाइल में डेटा नहीं मिला':              '❌ No data found in file',
  '❤️ Family — सबसे बड़ा Support':            '❤️ Family — biggest Support',
  '➕ Content Add करें':                      '➕ Add Content',
  '➕ नया Button जोड़ें':                    '➕ Add New Button',
  '🌟 प्रशंसा':                              '🌟 Praise',
  '🌴 Leave का कारण':                        '🌴 Leave Reason',
  '🌴 छुट्टी आवेदन':                          '🌴 Leave Application',
  '🎉 कोई भी Left नहीं हुआ':                 '🎉 Nobody has left',
  '🎬 Video URL set नहीं है':                 '🎬 Video URL not set',
  '👤 नए रजिस्ट्रेशन':                        '👤 New Registrations',
  '👤 नया कर्मचारी':                          '👤 New Employee',
  '💳 UPI से Pay करें':                       '💳 Pay via UPI',
  '📅 तारीख':                                 '📅 Date',
  '📅 मेरा शिफ्ट कैलेंडर':                   '📅 My Shift Calendar',
  '📋 कारण':                                  '📋 Reason',
  '📋 पूरी जानकारी (Details)':                '📋 Full Details',
  '📋 रिपोर्ट':                              '📋 Report',
  '📋 रिपोर्ट दर्ज करें':                    '📋 File Report',
  '📌 विषय (Title)':                          '📌 Title',
  '📝 C-Off कारण':                           '📝 C-Off Reason',
  '📝 कारण (Reason)':                         '📝 Reason',
  '📝 कोई कारण उपलब्ध नहीं है':              '📝 No reason available',
  '📝 बदलाव pending हैं':                    '📝 Changes pending',
  '📞 संपर्क सूत्र':                          '📞 Contact',
  '📢 महत्वपूर्ण जानकारी':                   '📢 Important Information',
  '📤 कर्मचारी List Upload करें':            '📤 Upload Employee List',
  '📱 नए Device Requests':                    '📱 New Device Requests',
  '📱 मोबाइल नंबर':                          '📱 Mobile Number',
  '📱 मोबाइल नंबर (SMS के लिए)':             '📱 Mobile Number (for SMS)',
  '📵 अनुपस्थित':                            '📵 Absent',
  '📷 Photos जोड़ें (Optional)':              '📷 Add Photos (Optional)',
  '🔄 OD रिकॉर्ड':                            '🔄 OD Records',
  '🔄 लाइव सिंक · अंतिम अपडेट:':              '🔄 Live Sync · Last Update:',
  '🔄 शिफ्ट पुनर्आवंटन':                     '🔄 Shift Reallocation',
  '🔥 आज':                                    '🔥 Today',
  '🙏 Seniors — जिनसे सीखा':                 '🙏 Seniors — who taught me',
  '🤝 Colleagues — साथ काम किया':            '🤝 Colleagues — worked together',

  // ── PHASE 3: Placeholders ──
  '10 अंक का नंबर':                          '10-digit number',
  'Button का नाम (जैसे: Safety Video)':       'Button name (e.g. Safety Video)',
  'Leave का कारण लिखें...':                  'Write leave reason...',
  'UNLOCK KEY डालें':                        'Enter UNLOCK KEY',
  'अपना Fast2SMS API Key यहाँ डालें':       'Enter your Fast2SMS API Key here',
  'अपना remark लिखें...':                    'Write your remark...',
  'इस content के बारे में...':                'About this content...',
  'काम का विवरण...':                         'Task description...',
  'कारण लिखें...':                            'Write reason...',
  'कोई अतिरिक्त जानकारी...':                  'Any additional info...',
  'छुट्टी का कारण लिखें... (अनिवार्य)':      'Write leave reason... (required)',
  'जैसे: M-1 pump check करना है':            'e.g. M-1 pump needs checking',
  'e.g. Safety Training':         'e.g. Metalliser Safety Training',
  'जैसे: कल से नई Shift Timing':             'e.g. New Shift Timing from tomorrow',
  'नाम या कोड से खोजें...':                  'Search by name or code...',
  'नियम लिखें...':                            'Write rule...',
  'पूरा नाम (Full Name)':                    'Full Name',
  'पूरी जानकारी लिखें... (मशीन नंबर, क्या हुआ, कब हुआ)': 'Write full details... (Machine no., what happened, when)',
  'मोबाइल नंबर (10 digits)':                 'Mobile number (10 digits)',
  'या कारण लिखें...':                         'Or write reason...',
  'सभी जरूरी details यहाँ लिखें...':          'Write all required details here...',
  '📌 Section का नाम':                        '📌 Department Name',
  // ── Schedule / Print / Shift settings (UI polish) ──
  '📋 Schedule बनाएं': '📋 Create Schedule',
  '🖨️ प्रिंट': '🖨️ Print',
  '🖨️ प्रिंट करें': '🖨️ Print',
  'प्रिंट करें': 'Print',
  'Print — Section चुनें': 'Print — Choose Departments',
  'जो sections print करनी हों उन्हें tick करें': 'Tick the sections you want to print',
  '✅ सभी': '✅ All',
  '☐ कोई नहीं': '☐ None',
  'रद्द': 'Cancel',
  'रद्द करें': 'Cancel',
  '✕ रद्द करें': '✕ Cancel',
  '✕ रद्द करें · Cancel': '✕ Cancel',
  '💾 Save करें': '💾 Save',
  '✅ Save करें': '✅ Save',
  '📝 बदलाव pending हैं': '📝 Changes pending',
  'बदलाव pending हैं': 'Changes pending',
  'कस्टम तारीख चुनें': 'Pick Custom Date',
  '🗓️ कस्टम तारीख चुनें': '🗓️ Pick Custom Date',
  '↕️ क्रम बदलें': '↕️ Reorder',
  'क्रम बदलें': 'Reorder',
  'साप्ताहिक छुट्टी': 'Weekly Off',
  'लीव': 'Leave',
  'जनरल': 'General',
  'अवकाश (Leaves)': 'Leaves',
  '+ नया अवकाश आवेदन': '+ New Leave Application',
  '⏳ प्रतीक्षा में': '⏳ Pending',
  '✅ मंजूर': '✅ Approved',
  '❌ अस्वीकार': '❌ Rejected',
  'टीम': 'Team',
  'नाम या कोड से खोजें...': 'Search by name or code...',
  'जो कर्मचारी टीम छोड़ चुके हैं': 'Employees who have left the team',
  'ऊपर Month चुनें': 'Select Month above',
  'विभाग': 'Department',
  'संपर्क करें': 'Contact',
  'UNLOCK KEY डालें': 'Enter UNLOCK KEY',
  '🔓 अनलॉक करें': '🔓 Unlock',
  '📲 App Install करें / Download App': '📲 Install / Download App',
  'App Install करें': 'Install App',
  '10 अंकों का Mobile': '10-digit Mobile',
  'Admin हैं? ': 'Admin? ',
  'OTP डालें': 'Enter OTP',
  'OTP भेजा गया': 'OTP sent',
  'वापस': 'Back',
  '← वापस': '← Back',
  '&larr; वापस': '← Back',
  'आप कौन हैं?': 'Who are you?',
  'अपनी भूमिका चुनें': 'Choose your role',
  'मैं एक Manager हूं — अपनी team बनाना चाहता/चाहती हूं': 'I am a Manager — I want to create my team',
  'मैं एक Member हूं — अपने Manager की team में शामिल हूं': 'I am a Member — I belong to my Manager’s team',
  'VKS Tech Admin verify करेगा': 'VKS Tech Admin will verify',
  'पूरा नाम *': 'Full Name *',
  'आपका नाम': 'Your name',
  'Company का नाम *': 'Company Name *',
  'जैसे: ABC Industries': 'e.g. ABC Industries',
  '-- चुनें --': '-- Select --',
  'Shift चुनें': 'Select Shift',
  '✏️ Shift चुनें': '✏️ Select Shift',
  'वर्तमान:': 'Current:',
  '⚙️ Shift & Machine Settings': '⚙️ Shift & Machine Settings',
  '⏰ Shifts — Auto Schedule के लिए': '⏰ Shifts — for Auto Schedule',
  '✅ टिक = Auto बनाएं में ये shifts rotate होंगी (जैसे सिर्फ D+N, या सिर्फ A+B+C)।': '✅ Tick = these shifts will rotate in Auto Generate (e.g. only D+N, or only A+B+C).',
  'सभी codes (D/N/A/B/C) schedule पर manually select हो सकते हैं — timing यहाँ से आती है।': 'All codes (D/N/A/B/C) can still be selected manually on the schedule — timings come from here.',
  '📉 Minimum Staff (संख्या कम होने पर highlight)': '📉 Minimum Staff (highlight when count is low)',
  'दिन की गिनती इस संख्या से कम हो तो summary में लाल/⚠️ दिखेगा।': 'If the day count is below this number, the summary shows red / ⚠️.',
  'Section min': 'Department min',
  'Slitter min': 'Slitter min',
  'Supervisor min': 'Supervisor min',
  '🏭 Machines / Sections': '🏭 Machines / Departments',
  '✂️ Slitter Machines': '✂️ Slitter Machines',
  '+ Section जोड़ें': '+ Add Metalliser',
  '+ SLitter जोड़ें': '+ Add Slitter',
  '+ Slitter जोड़ें': '+ Add Slitter',
  '🤖 Auto बनाएं': '🤖 Auto Generate',
  '← बदलें': '← Change',
  'बदलें': 'Change',
  'Drag करके Cells चुनें · Double-tap करके Copy/Select करें': 'Drag to select cells · Double-tap to Copy/Select',
  'Cell tap करें: D → N → O → L → G → CO → ½ → Ab → साफ': 'Cell tap: D → N → O → L → G → CO → ½ → Ab → clear',
  'कर्मचारी': 'Employee',
  'छुट्टी': 'Off',
  'Save करें।': 'Save.',
  '✅ Shift Settings save हो गईं': '✅ Shift Settings saved',
  '⚠️ कम से कम एक Machine जोड़ें': '⚠️ Add at least one Machine',
  '⚠️ सभी Shift की Code और नाम भरें': '⚠️ Fill code and name for all shifts',
  '⚠️ Auto के लिए कम से कम 1 shift tick करें (D/N या A/B/C)': '⚠️ Tick at least 1 shift for Auto (D/N or A/B/C)',
  '❌ कम से कम एक section चुनें': '❌ Select at least one section',
  '❌ Print library load नहीं हुई — page refresh करके फिर try करें': '❌ Print library failed to load — refresh the page and try again',
  '📸 Image बन रही है... रुकिए': '📸 Creating image… please wait',
  '✅ Schedule image download हो गई!': '✅ Schedule image downloaded!',
  'Company select करें पहले': 'Select a Company first',
  '❌ Company select करें पहले': '❌ Select a Company first',
  '⚠️ पहले header से एक Company चुनें': '⚠️ Select a Company from the header first',
  'आपकी अपनी Team के लिए': 'For your own team',
  '⏳ Loading...': '⏳ Loading...',
  'नया PASSWORD (कम से कम 5 अंक) *': 'New PASSWORD (min 5 characters) *',
  'Password कम से कम 5 characters होना चाहिए': 'Password must be at least 5 characters',
  '❌ Password कम से कम 5 characters होना चाहिए': '❌ Password must be at least 5 characters',
  'क्रम & Group save हो गया! Schedule update हो रही है...': 'Order & group saved! Updating schedule…',
  '✅ क्रम & Group save हो गया! Schedule update हो रही है...': '✅ Order & group saved! Updating schedule…',
  '🔄 Default order restore हो गया': '🔄 Default order restored',
  'Custom order और role assignments हट जाएंगे।': 'Custom order and role assignments will be removed.',
  'यह action undo नहीं होगी।': 'This action cannot be undone.',
  '🔄 हाँ, Reset करें': '🔄 Yes, Reset',
  'कर्मचारी क्रम व Group बदलें': 'Reorder employees & change groups',
  '▲▼ से क्रम बदलें • Dropdown से Group बदलें • फिर Save करें': 'Use ▲▼ to reorder · Dropdown to change group · then Save',
  'MANAGERS & उनकी TEAMS (Mobile Registration)': 'MANAGERS & THEIR TEAMS (Mobile Registration)',
  'कर्मचारी (Employee Code System)': 'Employees (Employee Code System)',
  'सीखें': 'Learn',
  'सीखें — Learn Now': 'Learn Now',
  'Learn & Grow': 'Learn & Grow',
  'दिन शिफ्ट': 'Day Shift',
  'रात शिफ्ट': 'Night Shift',
  'A Shift': 'A Shift',
  'B Shift': 'B Shift',
  'C Shift': 'C Shift',
  'Day Shift': 'Day Shift',
  'Night Shift': 'Night Shift',
  'साप्ताहिक छुट्टी:': 'Weekly Off:',
  'मशीन:': 'Machine:',
  'बाद में': 'Later',
  'बंद करें': 'Close',
  'Close': 'Close',
  'Koi tampering log nahi — sab safe hai': 'No tampering log — all safe',
  '✅ Koi tampering log nahi — sab safe hai': '✅ No tampering log — all safe',
  'डेटा initialize हो गया': 'Data initialized',
  '✅ डेटा initialize हो गया': '✅ Data initialized',
  '🌐 सभी Companies दिख रही हैं': '🌐 Showing all companies',
  '🏢 अब सिर्फ इस Company का data दिख रहा है': '🏢 Showing data for this company only',
  '⚠️ पहले Schedule खोलें': '⚠️ Open the Schedule first',
  '✅ ${generated} कर्मचारियों की Schedule auto-generate हो गई!': '✅ Auto-generated schedule for ${generated} employees!',
  'approved leave दिन सुरक्षित रहे': 'approved leave days protected',
  'Save करें': 'Save',
  'नाम': 'Name',
  'कोड': 'Code',
  'to': 'to',
  'अवर्गीकृत': 'Unassigned',
  'Met (All)': 'Met (All)',
  'Slit (सभी Slitter)': 'Slit (All Slitter)',
  'NCR रिपोर्ट': 'NCR Report',
  'अनुपस्थिति': 'Absence',
  'अनुपस्थित': 'Absentees',
  'W-Off पर': 'on W off',
  'ड्यूटी पर': 'On duty',
  'अवकाश पर': 'On leave',
  'चेतावनी / अनुशासनहीनता': 'Warning / Indiscipline',
  'प्रशंसा': 'Appreciation',
  'Imp. Information': 'Imp. Information',
  'सुपरवाइज़र': 'Supervisor',
  'मैनेजर': 'Manager',
  'मेटलाइज़र-1': 'Metalliser-1',
  'मेटलाइज़र-2': 'Metalliser-2',
  'स्लिटर-1': 'Slitter-1',
  'स्लिटर-2': 'Slitter-2',
  'दिन (7AM-7PM)': 'Day (7AM-7PM)',
  'रात (7PM-7AM)': 'Night (7PM-7AM)',
  'Current View (screen filter)': 'Current View (screen filter)',
  '📋 Current View (screen filter)': '📋 Current View (screen filter)',
  '📋 CURRENT VIEW': '📋 CURRENT VIEW',
  '📋 ALL EMPLOYEES': '📋 ALL EMPLOYEES',
  'All Employees': 'All Employees',
  '📋 All Employees': '📋 All Employees',
  'Shift Trends': 'Shift Trends',
  'SHIFT TRENDS': 'SHIFT TRENDS',
  'Live Sync · Last Update:': 'Live Sync · Last Update:',
  'Pick Custom Date': 'Pick Custom Date',
  'Pending': 'Pending',
  'To-Do': 'To-Do',
  'Reports': 'Reports',
  'Home': 'Home',
  'Schedule': 'Schedule',
  'Leave': 'Leave',
  'Team': 'Team',

  // ── Schedule Builder / mixed labels (EN mode) ──
  'सभी Section': 'All Departments',
  'महीना चुनें': 'Select Month',
  'तारीख रेंज': 'Date Range',
  '📅 पूरा महीना': '📅 Full Month',
  '🗓️ कस्टम तारीख': '🗓️ Custom Dates',
  'से (From)': 'From',
  'तक (To)': 'To',
  'उदा. 11 से 20 — केवल ये दिन Schedule में दिखेंगे': 'e.g. 11 to 20 — only these days will appear in the schedule',
  'कर्मचारी': 'Employee',
  'नए कर्मचारी': 'New employees',
  'कुल': 'Total',
  'नाम और कोड जरूरी है': 'Name and code are required',
  '❌ Manager section में सिर्फ Admin जोड़ सकते हैं': '❌ Only Admin can add Manager-section employees',
  'जोड़ा गया': 'added',
  '📱 यह मोबाइल नंबर पहले से दूसरे team के member के पास है': '📱 This mobile number already belongs to a member of another team',
  '📱 यह मोबाइल नंबर पहले से registered है': '📱 This mobile number is already registered',
  '🚫 Duplicate mobile — other team': '🚫 Duplicate mobile — other team',
  '🚫 Duplicate mobile': '🚫 Duplicate mobile',
  'कर्मचारी List Upload करें': 'Upload Employee List',
  'Preview — Save करने से पहले देखें': 'Preview — review before Save',
  'Confirm करें — Firebase में Save': 'Confirm — Save to Firebase',
  'वापस': 'Back',
  'row(s) skip हुई': 'row(s) skipped',
  'कर्मचारी save हो गए!': 'employees saved!',
  'यह मोबाइल नंबर दूसरे team में पहले से है': 'This mobile is already used in another team',
  'File में Duplicate mobile': 'Duplicate mobile in file',

};

/**
 * t(str) — translate a string based on current language.
 * Supports all Indian languages via _i18n_ML + classic _i18n_HI_EN fallback.
 * Fallback chain: selected lang → en → original (Hindi).
 */

/**
 * L(hi, en) — multi-language UI string helper (replaces isEn ? en : hi).
 * Uses mlT/t when available so gu/ta/kn/ar/de/... all work; never leaves Hindi when lang≠hi if EN exists.
 */

/** BCP47 locale for Intl APIs from app _lang */

/** Load script-specific webfont only when needed (saves bandwidth on shop networks) */
function loadLangFont(lang){
  lang = lang || (typeof _lang!=='undefined'?_lang:'hi');
  var map = {
    ar: 'Noto+Sans+Arabic:wght@400;700',
    ur: 'Noto+Sans+Arabic:wght@400;700',
    gu: 'Noto+Sans+Gujarati:wght@400;700',
    ta: 'Noto+Sans+Tamil:wght@400;700',
    te: 'Noto+Sans+Telugu:wght@400;700',
    kn: 'Noto+Sans+Kannada:wght@400;700',
    bn: 'Noto+Sans+Bengali:wght@400;700',
    or: 'Noto+Sans+Oriya:wght@400;700',
    mr: 'Noto+Sans+Devanagari:wght@400;700',
    ml: 'Noto+Sans+Malayalam:wght@400;700',
    pa: 'Noto+Sans+Gurmukhi:wght@400;700',
    zh: 'Noto+Sans+SC:wght@400;700',
    th: 'Noto+Sans+Thai:wght@400;700'
  };
  var fam = map[lang];
  var link = document.getElementById('mp-fonts-lang');
  if(!link){
    link = document.createElement('link');
    link.id = 'mp-fonts-lang';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if(!fam){
    link.removeAttribute('href');
    return;
  }
  var href = 'https://fonts.googleapis.com/css2?family='+fam+'&display=swap';
  if(link.getAttribute('href') !== href) link.setAttribute('href', href);
}

function mpLocale(lang){
  lang = lang || (typeof _lang !== 'undefined' ? _lang : 'en');
  var map = {hi:'hi-IN',en:'en-IN',gu:'gu-IN',ta:'ta-IN',te:'te-IN',kn:'kn-IN',bn:'bn-IN',or:'or-IN',
    ar:'ar-AE',ur:'ur-PK',zh:'zh-CN',de:'de-DE',it:'it-IT',es:'es-ES',tr:'tr-TR',pt:'pt-BR',th:'th-TH',id:'id-ID',vi:'vi-VN'};
  return map[lang] || 'en-IN';
}
/** Format date for current language */
function mpFormatDate(d, opts){
  try{
    var dt = (d instanceof Date) ? d : new Date(d);
    if(isNaN(dt.getTime())) return String(d||'');
    return dt.toLocaleDateString(mpLocale(), opts || {day:'2-digit',month:'short',year:'numeric'});
  }catch(e){ return String(d||''); }
}
/** Simple plural: mpPlural(n, oneHi, manyHi, oneEn, manyEn) */
function mpPlural(n, oneHi, manyHi, oneEn, manyEn){
  n = Number(n)||0;
  var hi = (n === 1) ? oneHi : manyHi;
  var en = (n === 1) ? oneEn : manyEn;
  if(typeof L === 'function') return L(hi, en).replace('{n}', String(n));
  var lang = (typeof _lang !== 'undefined') ? _lang : 'hi';
  return (lang === 'hi' ? hi : en).replace('{n}', String(n));
}
/** Export i18n table as JSON for translators */
function mpExportI18n(){
  try{
    var data = {lang: _lang, country: _country, supported: window._i18n_SUPPORTED||[], sample: {}};
    if(window._i18n_ML){
      var keys = Object.keys(window._i18n_ML).slice(0, 50);
      keys.forEach(function(k){ data.sample[k] = window._i18n_ML[k]; });
    }
    var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manpower-i18n-export.json';
    a.click();
    if(typeof toast==='function') toast('📥 i18n export downloaded');
  }catch(e){ console.warn(e); }
}
function mpToggleI18nDebug(){
  try{
    var on = localStorage.getItem('mp_i18n_debug') === '1';
    localStorage.setItem('mp_i18n_debug', on ? '0' : '1');
    if(typeof toast==='function') toast(on ? 'i18n debug OFF' : 'i18n debug ON — missing keys highlighted');
    if(typeof applyLang==='function') applyLang();
  }catch(e){}
}


/** Time-of-day greeting in current (or given) language — feels personal */
function mpGreeting(lang){
  lang = lang || (typeof _lang!=='undefined'?_lang:'hi');
  var h = new Date().getHours();
  var map = {
    hi: h<12?'सुप्रभात':h<17?'नमस्कार':'शुभ संध्या',
    en: h<12?'Good morning':h<17?'Good afternoon':'Good evening',
    gu: h<12?'સુપ્રભાત':h<17?'નમસ્કાર':'શુભ સાંજ',
    kn: h<12?'ಶುಭೋದಯ':h<17?'ನಮಸ್ಕಾರ':'ಶುಭ ಸಂಜೆ',
    ta: h<12?'காலை வணக்கம்':h<17?'வணக்கம்':'மாலை வணக்கம்',
    te: h<12?'శుభోదయం':h<17?'నమస్కారం':'శుభ సాయంత్రం',
    bn: h<12?'সুপ্রভাত':h<17?'নমস্কার':'শুভ সন্ধ্যা',
    or: h<12?'ଶୁଭ ସକାଳ':h<17?'ନମସ୍କାର':'ଶୁଭ ସନ୍ଧ୍ୟା',
    ar: h<12?'صباح الخير':h<17?'مرحباً':'مساء الخير',
    ur: h<12?'صبح بخیر':h<17?'السلام علیکم':'شام بخیر',
    zh: h<12?'早上好':h<17?'你好':'晚上好',
    de: h<12?'Guten Morgen':h<17?'Guten Tag':'Guten Abend',
    es: h<12?'Buenos días':h<17?'Buenas tardes':'Buenas noches',
    tr: h<12?'Günaydın':h<17?'Merhaba':'İyi akşamlar',
    pt: h<12?'Bom dia':h<17?'Boa tarde':'Boa noite',
    th: h<12?'อรุณสวัสดิ์':h<17?'สวัสดี':'สวัสดีตอนเย็น',
    id: h<12?'Selamat pagi':h<17?'Selamat siang':'Selamat malam',
    vi: h<12?'Chào buổi sáng':h<17?'Xin chào':'Chào buổi tối',
    it: h<12?'Buongiorno':h<17?'Buon pomeriggio':'Buonasera'
  };
  return map[lang] || map.en;
}

function L(hi, en){
  try{
    var lang = (typeof _lang !== 'undefined' && _lang) ? String(_lang).toLowerCase() : '';
    if(!lang){
      try{ lang = String(localStorage.getItem('mp_lang')||'').toLowerCase(); }catch(e){}
    }
    // Hindi only when explicitly hi
    var isHi = (lang === 'hi' || lang === 'hindi' || lang === 'hin');
    if(isHi) return hi;
    // English (or any non-hi): prefer explicit en, then maps
    if(en != null && en !== '') return en;
    if(typeof mlT === 'function'){
      var v = mlT(hi, lang || 'en');
      if(v && v !== hi) return v;
    }
    if(typeof t === 'function'){
      var v2 = t(hi);
      if(v2 && v2 !== hi) return v2;
    }
    if(typeof _i18n_HI_EN === 'object' && _i18n_HI_EN[hi]) return _i18n_HI_EN[hi];
    return hi;
  }catch(e){ return (en != null && en !== '') ? en : hi; }
}

function t(str){
  if(!str || typeof str !== 'string') return str;
  if(typeof _lang === 'undefined' || _lang === 'hi') return str;
  // Multi-lang meaning map + Brahmic script fallback (via mlT)
  if(typeof mlT === 'function'){
    const ml = mlT(str, _lang);
    if(ml !== str) return ml;
  }
  // Classic HI→EN dictionary
  if(typeof _i18n_HI_EN === 'object' && _i18n_HI_EN[str]) return _i18n_HI_EN[str];
  // Prefix match for dynamic suffixes
  if(typeof _i18n_HI_EN === 'object'){
    for(const key of Object.keys(_i18n_HI_EN)){
      if(key.length > 5 && str.startsWith(key)){
        let tail = _i18n_HI_EN[key] + str.slice(key.length);
        // Script-convert leftover Devanagari in dynamic tail when needed
        if(typeof mlScript === 'function') tail = mlScript(tail, _lang);
        return tail;
      }
    }
  }
  // Last resort: script-convert free Hindi text for Brahmic UI languages
  if(typeof mlScript === 'function') return mlScript(str, _lang);
  return str;
}


/** User-facing Firebase / network errors (no raw PERMISSION_DENIED) */
function friendlyFbError(err){
  const msg = String((err && (err.message||err.code)) || err || '');
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  if(/PERMISSION_DENIED|permission_denied/i.test(msg))
    return en
      ? 'Action not allowed. Try Phone verify once on this device, or ask Admin/Manager.'
      : 'यह क्रिया अनुमति नहीं मिली। इस device पर एक बार Phone verify करें, या Admin/Manager से पूछें।';
  if(/network|offline|Failed to fetch|unavailable/i.test(msg))
    return en ? 'Network issue — check internet and retry.' : 'नेटवर्क समस्या — इंटरनेट जाँचें और फिर try करें।';
  if(/too many requests|quota/i.test(msg))
    return en ? 'Too many attempts — wait a minute and try again.' : 'बहुत attempts हो गए — थोड़ा रुककर फिर try करें।';
  return msg.length > 120 ? msg.slice(0,120)+'…' : msg;
}

const _TOAST_HI_EN = {
  '⏳ Manager approve होने तक सिर्फ Home / To-Do / Learn उपलब्ध हैं': '⏳ Until Manager approves, only Home / To-Do / Learn are available',
  'Install रद्द किया — ऊपर address bar में Install भी try करें': 'Install cancelled — try Install in the address bar too',
  '⚠️ Auto के लिए कम से कम 1 shift tick करें (D/N या A/B/C)': '⚠️ Tick at least 1 shift for Auto (D/N or A/B/C)',
  'ℹ️ Password बाद में Profile से सेट कर सकते हैं': 'ℹ️ You can set password later from Profile',
  '⚠️ Display error — कृपया page refresh करें': '⚠️ Display error — please refresh the page',
  '📱 Member login: पहले Mobile Number डालें': '📱 Member login: first Mobile Number',
  '⚠️ शुरू की तारीख अंत से पहले होनी चाहिए': '⚠️ Start date must be before end date',
  '❌ Write auth missing — OTP verify करें': '❌ Write auth missing — verify OTP',
  '⚠️ C-Off के लिए Shift Date जरूरी है': '⚠️ Shift date is required for C-Off',
  '❌ Schedule edit permission नहीं है': '❌ No schedule edit permission',
  '❌ Leave approve permission नहीं है': '❌ Leave approve permission No है',
  '⚠️ 10 अंकों का Mobile Number डालें': '⚠️ Enter a 10-digit mobile number',
  '✅ Fingerprint login set up हो गया!': '✅ Fingerprint login set up done!',
  '❌ Leave delete permission नहीं है': '❌ Leave delete permission No है',
  '⚠️ 10 अंकों का valid mobile डालें': '⚠️ Enter a valid 10-digit mobile',
  '⚠️ Schedule Builder open नहीं है': '⚠️ Schedule Builder open No है',
  '⚠️ C-Off के लिए Shift Date जरूरी': '⚠️ Shift date is required for C-Off',
  '✅ Schedule image download हो गई!': '✅ Schedule image download done!',
  '❌ Leave edit permission नहीं है': '❌ Leave edit permission No है',
  '🔄 Original shift restore हो गई': '🔄 Original shift restore done',
  'इस कर्मचारी का कोई NCR नहीं है': 'No NCR for this employee',
  '🔄 Default order restore हो गया': '🔄 Default order restore done',
  '👆 Fingerprint से login हो गया!': '👆 Fingerprint से login done!',
  '📲 OTP SMS से auto-fill हो गया': '📲 OTP SMS से auto-fill done',
  '⚠️ EL Limit पार! Available: ': '⚠️ EL Limit पार! Available:',
  '⚠️ कृपया दोनों तारीखें चुनें': '⚠️ Please select both dates',
  '⏳ Install तैयार हो रहा है...': '⏳ Preparing install...',
  '❌ Department / Machine चुनें': '❌ Department / Machine',
  '⚠️ सही 10 अंक का नंबर डालें': '⚠️ Enter a correct 10-digit number',
  'नाम और link दोनों जरूरी हैं': 'Name and link are both required',
  '❌ Report permission नहीं है': '❌ Report permission No है',
  '⚠️ 10MB से छोटी फोटो चुनें': '⚠️ Choose a photo under 10MB',
  '✅ SMS Settings save हो गई': '✅ SMS Settings saved',
  '❌ Employee add नहीं हुआ: ': '❌ Employee add No हुआ:',
  '✅ Dedication save हो गई!': '✅ Dedication save done!',
  '✅ Login हो गया! Welcome ': '✅ Login done! Welcome',
  '⏳ Excel तैयार हो रहा है…': '⏳ Preparing Excel…',
  '⚠️ From / To date चुनें': '⚠️ From / To date',
  '⚠️ 6 अंकों का OTP डालें': '⚠️ Enter the 6-digit OTP',
  '✅ Schedule save हो गई!': '✅ Schedule saved!',
  '🗑️ Report delete हो गई': '🗑️ Report delete done',
  '⏳ Verify हो रहा है...': '⏳ Verifying...',
  '✅ Content add हो गया!': '✅ Content add done!',
  '⚠️ पहले API Key डालें': '⚠️ Enter API Key first',
  '✅ Price update हो गई!': '✅ Price update done!',
  'सही मोबाइल नंबर डालें': 'Enter a valid mobile number',
  '⏳ Excel पढ़ रहे हैं…': '⏳ Reading Excel…',
  '❌ Permission नहीं है': '❌ Permission No है',
  '✅ UPI ID Copy हो गई!': '✅ UPI ID Copy done!',
  'नाम और कोड जरूरी है': 'Name and code are required',
  '⚠️ API Key खाली है': '⚠️ API Key is empty',
  'कर्मचारी नहीं मिला': 'Employee not found',
  'Content नहीं मिला': 'Content not found',
  '⚠️ Title जरूरी है': '⚠️ Title is required',
  '⚠️ कर्मचारी चुनें': '⚠️ Select employee',
  'कोई बदलाव नहीं है': 'No changes to save',
  'सभी जानकारी भरें': 'Fill in all details',
  'जल्द आ रहा है! ⏳': 'Coming soon! ⏳',
  '⚠️ कोई data नहीं': '⚠️ कोई data No',
  '❌ कोई match नहीं': '❌ कोई match No',
  '🗑️ Delete हो गया': '🗑️ Delete done',
  'सही price डालें': 'Enter a valid price',
  'पहले plan चुनें': 'Select a plan first',
  'अंतिम दिन चुनें': 'Select end date',
  'कर्मचारी चुनें': 'Select employee',
  '⚠️ महीना चुनें': '⚠️ Select month',
  '⚠️ Column खाली': '⚠️ Column is empty',
  '⚠️ Month चुनें': '⚠️ Month',
  '⚠️ Date चुनें': '⚠️ Select date',
  'URL खाली है': 'URL is empty',
  '❌ Key डालें': '❌ Key',
  '⚠️ Row खाली': '⚠️ Row empty',
  'तारीख भरें': 'Enter date',
  'कारण चुनें': 'Select reason',
  'Plan चुनें': 'Select plan',
  'Title भरें': 'Enter title',
  'Date चुनें': 'Select date',
  'नाम भरें': 'Enter name',
};

function toast(msg){
  let out = msg;
  try{
    if(typeof t === 'function') out = t(String(msg==null?'':msg));
    // Extra toast dictionary for mixed Hindi left in English mode
    if(typeof _lang !== 'undefined' && _lang !== 'hi' && typeof out === 'string'){
      if(typeof _TOAST_HI_EN === 'object' && _TOAST_HI_EN[out]) out = _TOAST_HI_EN[out];
      else if(typeof _TOAST_HI_EN === 'object'){
        // Longest-key prefix / contains replace for dynamic toasts
        const keys = Object.keys(_TOAST_HI_EN).sort((a,b)=>b.length-a.length);
        for(const k of keys){
          if(k.length >= 6 && out.indexOf(k) >= 0){
            out = out.split(k).join(_TOAST_HI_EN[k]);
          }
        }
      }
      // Strip leftover common Hindi fragments in EN mode
      if(/[\u0900-\u097F]/.test(out)){
        const frag = [
          ['नहीं है',' not available'],['नहीं मिला',' not found'],['जरूरी है',' required'],
          ['कृपया','Please'],['डालें',''],['चुनें',''],['भरें',''],
          ['हो गई',' saved'],['हो गया',' done'],['सेव','save'],
          ['रद्द करें','Cancel'],['सेव करें','Save'],['बंद करें','Close'],
          ['permission नहीं','no permission'],['verify करें','verify'],
          ['page refresh करें','refresh the page'],['महीना','month'],
          ['तारीख','date'],['कर्मचारी','employee'],['नाम','name'],
        ];
        for(const [h,e] of frag){ if(out.indexOf(h)>=0) out = out.split(h).join(e); }
        out = out.replace(/\s{2,}/g,' ').trim();
      }
    }
  }catch(e){ out = msg; }
  const t_el = document.getElementById('toast');
  if(!t_el){ console.log('[toast]', out); return; }
  t_el.textContent = out;
  t_el.classList.add('show');
  setTimeout(()=>t_el.classList.remove('show'),3000);
}
