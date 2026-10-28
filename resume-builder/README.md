# Top-Class Resume Builder

A complete, production-ready, modular single-page web application for building professional, ATS-friendly resumes.

## Features

- **Light / Dark mode** with smooth transitions and LocalStorage persistence (does not affect the printed A4 resume)
- **6-step guided wizard**:
  1. Personal & Contact (including Passport Number, LinkedIn, Portfolio, optional passport-size photo)
  2. Professional Summary / Objective
  3. Work Experience (add multiple roles + bullet achievements)
  4. Education & Certifications
  5. Skills (technical + soft) & Languages
  6. Projects / Publications / Custom sections
- **4 professional templates**:
  - Executive (classic single-column, high ATS score)
  - Modern Minimalist
  - Creative (gradient header)
  - Two-Column Professional
- Real-time live A4 preview that updates as you type
- Optional photo upload (base64, stored locally)
- Compact / expanded spacing toggle
- Perfect A4 print / Save-as-PDF support (`window.print()`)
- Full LocalStorage persistence – never lose progress on refresh
- Modern responsive UI with Tailwind CSS + vanilla JavaScript
- Progress bar, step indicators, validation helpers

## How to Use

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
2. Fill the wizard step by step.
3. Switch templates and toggle photo/compact mode on the left panel.
4. Click **Print / PDF** and choose “Save as PDF” (set margins to None / Minimum and enable Background graphics for best results).

## File Structure

```
resume-builder/
├── index.html          # Main application
├── css/
│   └── styles.css      # Custom styles + 4 resume templates + print CSS
├── js/
│   └── app.js          # All application logic (wizard, state, rendering, storage)
└── README.md
```

## Technical Notes

- No build step required – pure HTML / CSS / JS with CDN Tailwind & Font Awesome.
- Photo is stored as base64 in LocalStorage (keep under 2 MB).
- Print CSS isolates the resume paper, forces A4 size, hides all UI chrome, and preserves colors.
- Two-column template is visually strong; for maximum ATS compatibility prefer Executive or Minimalist when submitting through automated portals.

## Browser Support

Chrome 90+, Firefox 90+, Safari 14+, Edge 90+.

---

Built as a complete, ready-to-use production application.
