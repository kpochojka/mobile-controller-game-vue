# Jungle Birds — implementation log

## Current codebase (post–Tetris removal)

- **`server.js`** — Express static + Socket.io; **only** Jungle events (`register-jungle-display`, `register-jungle-player`, `jungle-control`, `jungle-score-update`, `jungle-game-end` + disconnect cleanup).
- **`src/router/index.js`** — `/` and `/jungle` → `JungleView.vue`; `/jungle-controller` → `JungleControllerView.vue`.
- **Removed:** Tetris views (`GameView`, `ControllerView`), `useTetris.js`, `TetrisBoard`, `ScorePanel`, `NextPiece`, `GameOverlay`, and legacy socket events (`register-display`, `register-controller`, `control`).
- **`src/components/QRCodeDisplay.vue`** — Jungle-only QR styling; optional `url` prop; env fallback path `/jungle-controller`.

Single-game app: Jungle Birds only.
