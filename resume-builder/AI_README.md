# Resume Builder — AI README

Standalone **ATS-friendly resume builder** shipped inside Man Power (`resume-builder/`).

Open: `resume-builder/index.html` (or app route that hosts this folder).

## Purpose
- Guided multi-step form → live A4 preview → print/PDF
- 16 layout templates (ATS-safe + role packs + premium)
- Local save (LocalStorage) + optional cloud/login gate shared with Man Power OTP

## Stack
- Vanilla JS single file: `js/app.js`
- Styles: `css/styles.css` (per-template classes `.template-*`)
- UI shell: `index.html`
- No build step required

## For AI editors
1. Read **`AI_INDEX.md`** first — feature → file map (minimal tokens).
2. Edit **one concern** at a time (layout CSS, preview mock, form step, export).
3. After layout/CSS changes, verify **Layout preview (sample)** (`#tplPreviewFrame` / `updateTplPreview`) **and** live `#resumePaper`.
4. Do not assume only 4 templates — product has **16** `data-template` values.

## Related parent app
Man Power root docs: `../AI_INDEX.md`, `../AI_README.md`, `../HOW_AI_READS.md`.
Admin / commercial features live outside this folder.
