# How an AI should read this app (token-minimal)

1. Open **AI_INDEX.md** first.
2. Open **FEATURES.md** only for a short product overview.
3. Edit **only** the file under the feature folder (`js/config`, `js/auth`, `js/team`, `js/schedule`, …).
4. Do not load entire `js/` tree.
5. After path changes, keep `index.html` and `sw.js` paths in sync.
6. Resume builder is separate: `resume-builder/js/app.js` (not Man Power core).

JS was reorganized into feature folders. Flat `js/*.js` no longer holds app modules.
