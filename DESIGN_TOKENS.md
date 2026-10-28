# Man Power — Design tokens (fonts & sizes)

Use these when embedding / integrating another UI into Man Power.

## Fonts (Google Fonts, loaded in index.html)

| Role | Family | Weights |
|------|--------|---------|
| UI body / Hindi | **Noto Sans** + **Noto Sans Devanagari** | 400, 600, 700 |
| Display / titles | **Barlow Condensed** | 700, 800, 900 |

CSS example:
```css
font-family: 'Noto Sans', 'Noto Sans Devanagari', system-ui, sans-serif;
/* titles */
font-family: 'Barlow Condensed', 'Noto Sans', sans-serif;
font-weight: 900;
letter-spacing: 0.02em;
```

## Type scale (common in app)

| Use | Size | Weight |
|-----|------|--------|
| Modal title | 18–20px | 900 Barlow |
| Section label | 11px | 700, letter-spacing 1px, muted |
| Body | 13–14px | 600–700 |
| Caption / hint | 10–12px | 600, muted |
| Big metric (days left) | 22px | 900 Barlow |
| Button primary | 14px | 800–900 |
| Chip / badge | 10–12px | 700–800 |

## Colours (shift badges — keep G same everywhere)

| Code | Background | Text |
|------|------------|------|
| D Day | `#a16207` | `#fff` |
| N Night | `#4f46e5` | `#fff` |
| **G General** | **`#2563eb`** | `#fff` |
| L Leave | `#be123c` / `#fb7185` | `#fff` |
| O Off | `#475569` / `#64748b` | `#fff` |
| H Holiday | `#ea580c` / `#f97316` | `#fff` |
| Brand orange | `#f97316` / `#ea580c` | |
| Brand purple | `#a855f7` / `#7c3aed` | |
| Success green | `#22c55e` / `#16a34a` | |
| Panel dark | `#0a0f1a` background | |
| Card | `var(--panel)` / `var(--card)` | |

## Spacing & radius

- Modal / card radius: **12–14px**
- Buttons: **10–12px** radius, padding **12–14px**
- Profile rows: icon 40–44px circle, gap 10px
- Calendar day cell: compact, badge ~22–28px

## Theme CSS variables (typical)

```css
--text, --muted, --muted2, --panel, --card, --border2, --lv (leave/danger)
```

Light/dark toggled via `body.light` / `body.dark`.
