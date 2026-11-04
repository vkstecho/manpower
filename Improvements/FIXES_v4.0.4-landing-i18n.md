# Landing EN/HI consistency + contact label (v4.0.4)

## Issues
1. Switching **Hindi → English** left some strings stuck in Hindi (footer Product/Company, CTA “About VKS Tech”, blurb, etc.).
   Cause: phrase map only keyed by English text, so Hindi text could not map back.
2. Contact section showed **vkstech.com** as label.

## Fixes
- `js/landing-i18n.js` rewritten: **data-i18n only** for chrome strings (bidirectional EN ↔ HI).
- `index.html`: `data-i18n` on section labels, CTA, footer headers, contact, About, meta line.
- Contact website label **VKS Tech** (link still `https://vkstech.com`).

## Note
Long feature/FAQ body paragraphs may stay English until tagged; nav, CTAs, section titles, footer, and contact switch cleanly both ways.

## Deploy
- `index.html`
- `js/landing-i18n.js`
