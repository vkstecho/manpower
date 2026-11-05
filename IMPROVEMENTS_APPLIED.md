# Man Power — Improvements applied (v4.0.3 landing)

## Landing page (conversion) — implemented

### Authority & social proof
- Founder block with photo, 9 years, 60-member teams, 818 MT, defects 9%→0.2%
- Embedded testimonials (Ajab Singh, N.K. Jena, Keshav Jha, Amit, Ghanshyam, Anuj) with real photos and career paths
- Nav link “People” → `#proof`
- Link to full `testimonials/htmls/testimonials.html` for all journeys

### Dual CTAs (commitment + talk-first)
- Hero: **Start free trial** + **Book 15-min setup call** (WhatsApp)
- Contact: call first, then trial
- Final CTA band: same dual choice
- Pricing note bar includes setup-call link

### Risk reversal
- Green risk bar under pricing: trial first; if it doesn’t save work, don’t continue
- FAQ: “What if it doesn’t fit our plant?” + “Can we talk before paying?” + “Who built Man Power?”

### Pricing admin (from v4.0.2)
- Seed annual from **current** monthly amounts (not locked to 99/499/999/1499)
- Max-members defaults: 799→60, 1499→60, 2999→200
- planLabel fallbacks updated for new bands

### Testimonials pack
- Reusable `testimonials/` folder for Man Power, Mentor, and website
- See `testimonials/HOW_TO_USE.md`

## WhatsApp CTA number
Uses `+91-8168771239` (from resume). Change `wa.me/918168771239` in `index.html` if you prefer another number.
