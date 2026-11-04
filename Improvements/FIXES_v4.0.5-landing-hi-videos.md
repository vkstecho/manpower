# v4.0.5 — Landing Hindi copy + 4 video URLs

## Hindi landing
Expanded `data-i18n` + HI strings for videos, features, Excel story, coverage, how-it-works, pricing chrome, contact, FAQ title, CTA, footer.

## Four admin video URLs
Payment settings (hard admin):
- EN short / EN long
- HI short / HI long  
(+ optional titles)

Published on `publicOffer` as `videoShortUrl`, `videoLongUrl`, `videoShortUrlHi`, `videoLongUrlHi`.

Landing language toggle loads the matching pair (HI falls back to EN if empty).

## Deploy
- `index.html`, `js/landing-i18n.js`
- `js/session/app-session-payment.js`
- `js/commercial/public-offer.js`
- `js/config/config.js`, `sw.js`
