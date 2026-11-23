# ManPower v6.0.74 — Whole-app source language/theme audit

## Scope and limitations
Reviewed the latest Comp Off staging package. Static scan covered 70 first-party JS/HTML/CSS files excluding translation dictionaries and third-party bundles: 2,052 Devanagari-containing lines, 412 lines with selected hardcoded dark/light colors, and 199 modal-related lines. These are candidates, **not** counts of confirmed defects. This is a source audit; not every UI state was browser-tested.

## Confirmed defects fixed
- Install App / PWA help: hard-coded light text and dark cancel controls in light theme changed to theme variables.
- Schedule Builder sticky month heading: near-white hardcoded heading changed to theme text color.
- Shared light-mode modal titles, placeholders and cancel button contrast guarded by scoped CSS.
- Existing Comp Off language, light-theme and A/B/C eligibility fixes retained.

## Reviewed for potential inconsistencies
Login, Home, My Shift, Schedule, Schedule Builder, Team, Employee forms, Leave, Pending, Reports, To-Do, Work Diary, Resign, Settings, Payment, Security, onboarding, installation and notifications. Translation helpers and multilingual dictionaries contain legitimate Hindi; removing all Hindi strings would be incorrect. Hard-coded colors are also intentionally used for roster legends, dark schedule grids, status badges and print layouts. Those were not blanket-replaced.

## Mandatory staging regression checks
For every modal, test English+Light, English+Dark, Hindi+Light, Hindi+Dark, plus selected, disabled and focus states. Test login OTP, manager shift edit/relogin, machine shortages, G global minimum, Comp Off eligibility, Team multi-select and install instructions. Live Firebase/browser validation has not been performed.

## Data safety
No Firebase data, rules, UID mapping, shift-save logic or historical data modified.
