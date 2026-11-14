# UI string audit — EN mode Hindi leftovers (v5.1.5)

## Method
Scanned JS/HTML for Devanagari outside `L(hi,en)` / ternary EN fallbacks.

## Categories

| Kind | Approx count | Notes |
|------|----------------|-------|
| Nav `lbl` Hindi keys | many | OK if `lblEn` used when EN |
| Excel header aliases (नाम, वेतन) | OK | Matching only, not UI |
| WhatsApp employee templates | intentional | Plant-floor Hindi |
| Admin payment HI video titles | intentional | Hindi content fields |
| **Hardcoded EN UI** | fixed below | User-visible in EN |

## Fixed in 5.1.5 (EN pure English)
- Team: salary empty state, device days left, NCR count, upload wizard title/help, file status, preview title/counts
- Login: pending member/manager messages, OTP session errors, new-employee hint
- Settings: Employee / days labels
- Login device: Submit → Admin WhatsApp lines
- Excel ops: Edit instructions title, section name placeholder
- Shift-edit: nested L() on C-Off reason chip

## Still may appear (next pass if needed)
- Full Team upload wizard body still partly Hinglish mixed in long help HTML
- Some excel-ops status / instructions item editors
- Home empty states edge cases
- WhatsApp message bodies (C-Off / Leave / Absent)
- `app-core.js` minified strings (SEC hi labels used via helpers)

## Recommendation
Prefer every user-visible string as `L('हिंदी','English')` or `${L(...)}` inside templates. Never put Devanagari in plain HTML attributes when EN is default.
