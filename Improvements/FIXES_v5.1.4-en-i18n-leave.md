# v5.1.4 — English UI: remove leftover Hindi in leave / shift modals

## Screenshot bug
Leave reason modal in **English** still showed:
- `Leave Type / कारण * (अनिवार्य)`
- Hindi placeholders and button labels

## Fixed (EN mode pure English)
- Leave reason title, label, placeholder, Mark Leave, Back
- Select shift title, Reset to original
- Comp-Off: which day, 31-day limit, empty state, reason, chips, Mark C-Off, alerts
- OD: department labels, select, Other, Mark OD
- Sequential WhatsApp Skip / Send labels
- Permission error text on save path

WhatsApp **message body** templates to employees may still include Hindi (intentional for plant floor). Can be made language-aware later from employee preferred language.

## File
- `js/schedule/sched-shift-edit.js`
