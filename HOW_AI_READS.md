# How an AI should read this app (token-minimal)

1. Open **AI_INDEX.md** first (feature → file map).
2. Open **FEATURES.md** only if you need a short product overview.
3. Edit **only** the `js/mg-*.js` module listed for that feature.
4. Do **not** load all modules. Do not use legacy `js/guidance.js` for edits (stub only).
5. Shared patterns: `window.MG`, state on `MG.state`, config on `MG.*` from `mg-config.js`.
6. Keep script order in `mentor.html` unchanged.
7. Optional future folders: `docs-ai-RECOMMENDED_FOLDERS.md`.

`guidance.js` was split into feature modules in v-modular. Runtime no longer depends on the monolith.
