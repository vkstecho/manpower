# Man Power JS layout (feature folders)

Edit **one folder** for one concern. See root `AI_INDEX.md`.

| Folder | Responsibility |
|--------|----------------|
| `config/` | App version, shift labels, admin phones, Firebase init |
| `core/` | Boot, utils, polyfill, a11y, train-data |
| `auth/` | Login OTP, device password, session restore, auth gate |
| `session/` | Home, nav, settings, payment UI |
| `team/` | Roster, Excel import/ops, forms, print/learn |
| `schedule/` | Schedule view, builder, offline queue, clipboard, undo |
| `commercial/` | License/paywall, public offer |
| `i18n/` | Locale strings |

Do not put new feature code in a flat `js/*.js` at this level.
