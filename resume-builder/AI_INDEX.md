# Resume Builder — AI Index (feature → file)

Read this file first. Touch only the listed path for that feature.

## Folder map
```
resume-builder/
  index.html          # Shell, template buttons, form steps, #resumePaper, #tplPreviewFrame
  css/styles.css      # All .template-* visual styles + print
  js/app.js           # State, wizard, render, templates, LocalStorage, login gate
  AI_INDEX.md         # This map
  AI_README.md        # Short purpose + edit rules
  README.md           # Human overview (may lag; prefer AI_INDEX for counts)
  icons/              # App icons
```

## Templates (16) — `data-template` values
| Button label | `data-template` | Live render path in `js/app.js` | Sample preview |
|--------------|-----------------|----------------------------------|----------------|
| ATS Clean | `ats` | `renderSingleColumn` | `updateTplPreview` |
| Executive | `executive` | `renderSingleColumn` | `updateTplPreview` |
| Minimalist | `minimalist` | `renderSingleColumn` | `updateTplPreview` |
| Classic Pro | `classic` | `renderSingleColumn` | `updateTplPreview` |
| Fresher | `fresher` | `renderSingleColumn` | `updateTplPreview` |
| Technical / Plant | `technical` | `renderTwoColumn` | `updateTplPreview` |
| Manager | `manager` | `renderSingleColumn` | `updateTplPreview` |
| Academic | `academic` | `renderSingleColumn` | `updateTplPreview` |
| Modern Bold | `modern` | `renderCreative` | `updateTplPreview` |
| Elegant Serif | `elegant` | `renderSingleColumn` | `updateTplPreview` |
| Creative | `creative` | `renderCreative` | `updateTplPreview` |
| Two-Column | `twocolumn` | `renderTwoColumn` | `updateTplPreview` |
| Sidebar Pro | `sidebar` | `renderTwoColumn` | `updateTplPreview` |
| Compact 1-Page | `compact` | `renderSingleColumn` + `.compact` | `updateTplPreview` |
| Navy Professional | `navy` | `renderSingleColumn` | `updateTplPreview` |
| Timeline | `timeline` | `renderTimeline` | `updateTplPreview` |

**CSS:** `.template-{name}` blocks in `css/styles.css`.

**Switch layout:** template buttons in `index.html` → handler in `js/app.js` sets `data.template` → `renderResume()` + `updateTplPreview(name)`.

## Feature → file

| Feature | Primary file | Notes |
|---------|--------------|--------|
| Wizard steps / progress | `js/app.js` (`showStep`, `updateProgress`, `validateStep`) | Steps in `index.html` |
| Personal / contact / photo | `js/app.js` + form fields in `index.html` | Photo base64 in state |
| Experience / education / certs / projects lists | `js/app.js` (`renderExperienceList`, …) | Dynamic list UI |
| Live A4 paper HTML | `js/app.js` `renderResume` → `renderSingleColumn` / `renderTwoColumn` / `renderCreative` / `renderTimeline` | Target `#resumePaper` |
| Template visual design | `css/styles.css` `.template-*` | Print rules at bottom of CSS |
| **Layout sample box** (left panel) | `js/app.js` **`updateTplPreview`** | `#tplPreviewFrame` in `index.html` — must stay unique per template |
| Compact spacing toggle | `js/app.js` + class `compact` on paper | Also forced for `ats` / `compact` |
| Theme light/dark | `js/app.js` `applyTheme` / `toggleTheme` | LocalStorage theme key; print unaffected |
| Save draft locally | `js/app.js` `saveData` / `loadData` | LocalStorage JSON |
| Print / PDF | `index.html` buttons + `css/styles.css` `@media print` | `window.print()` |
| Login gate (OTP / cloud) | `js/app.js` `rbForceLoginGate` + related | Shared Man Power mobile account |
| Icons / branding | `index.html`, `icons/`, `resume-icon.jpg` | |

## Edit recipes (minimal tokens)
- **Change one layout look** → only `css/styles.css` `.template-{id}` (+ optional `updateTplPreview` branch for that id).
- **Fix “previews look the same”** → `updateTplPreview` in `js/app.js` (sample) and/or template CSS (live).
- **Add a new layout** → `index.html` button `data-template="…"`, CSS `.template-…`, `renderResume` branch if structure differs, `updateTplPreview` entry.
- **Change form fields** → `index.html` + `collectFormData` / `populateForm` / section renderers in `js/app.js`.
- **Print margins / one page** → `css/styles.css` `@media print` and `.resume-paper.one-page`.

## Out of scope (parent Man Power)
Shift schedule, team Excel, payments, `publicOffer` videos → parent `js/` and root `AI_INDEX.md`, not this folder.
