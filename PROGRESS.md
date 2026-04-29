# Session Progress

## 1. Completed in this session

### Modified files
- `server.js` — added Jungle game socket state (`jungleDisplaySocket`, `junglePlayers`, `BIRD_POOL`, `birdIndex`) and all 5 jungle event handlers (`register-jungle-display`, `register-jungle-player`, `jungle-control`, `jungle-score-update`, `jungle-game-end`) plus disconnect cleanup for jungle players; all changes are additive and do not touch the existing Tetris logic
- `src/router/index.js` — added two imports (`JungleView`, `JungleControllerView`) and two routes (`/jungle`, `/jungle-controller`)
- `src/components/QRCodeDisplay.vue` — added optional `url` prop; if provided it overrides the internal URL logic so the component can point to `/jungle-controller` instead of `/controller`

### New files created
- `src/composables/useJungle.js` — all client-side game logic: rAF game loop, 60 s countdown timer, player map, food array, collision detection, score emit, `initGame / addPlayer / removePlayer / applyControl / applyScoreUpdate / getBoardState / cleanup`
- `src/components/JungleCanvas.vue` — canvas renderer; draws background, 8 hardcoded leaf patches, food emoji, bird emoji with name + score below, HUD timer top-right; runs its own rAF loop and cancels on unmount
- `src/components/JungleScoreboard.vue` — live leaderboard sorted by score descending; highlights the leader row
- `src/components/JungleOverlay.vue` — full-screen end-of-round ranking with 🥇🥈🥉 medals, fade transition, "scan QR to play again" hint
- `src/views/JungleView.vue` — display page (`/jungle`); registers as jungle display, wires all socket events, lays out QR sidebar / canvas / scoreboard in a flex row
- `src/views/JungleControllerView.vue` — mobile controller (`/jungle-controller`); registers as jungle player, shows assigned bird + live score, touch D-pad with `touchstart`/`touchend` + `preventDefault`, game-over screen

## 2. Current state of the app

- `npm run build` completes with 0 errors and 0 warnings (158 modules).
- **Tetris game** (`/`, `/controller`) is completely unchanged and still works.
- **Jungle Birds game** is fully implemented end-to-end:
  - Opening `/jungle` on the screen initialises the game, starts the 60 s timer, and renders the canvas.
  - Opening `/jungle-controller` on a phone assigns a unique bird, shows the D-pad, and connects the player to the shared canvas.
  - Movement, food collection, score sync, and end-of-round ranking overlay are all wired up.
  - Supports 1–8+ players simultaneously (birds cycle through the pool if > 8 join).

## 3. What was NOT finished / known issues

- **Not tested live** — the build succeeds but the game has not been run against a real server with real phones in this session. Smoke-testing on a local network is the recommended next step.
- **`jungle-player-joined` sends the full list, but `addPlayer` in the composable does not deduplicate** — if the display receives an already-known player ID again it will silently overwrite position (benign but worth noting).
- **`JungleView` `jungle-player-left` handler** rebuilds the full player list by adding all incoming players then removing absent ones — this resets positions of existing players. A cleaner approach would diff by ID only.
- **No "waiting for players" lobby screen** — the game timer starts immediately when `jungle-display-ready` fires (even with 0 players). If a game round ends and a new player joins, they see a finished game until the page is reloaded.
- **No round-restart mechanism** — after `jungle-game-end` the only way to start a new round is to reload `/jungle`.
- **`birdIndex` in `server.js` is never reset** — after a round ends, birds are still assigned in sequence from wherever the index left off. This is fine for continuous play but worth knowing.

## 4. Exact next step for the next session

**Run a live smoke test:**
1. `npm run build && node server.js`
2. Open `http://localhost:3000/jungle` on the computer.
3. Open `http://<local-ip>:3000/jungle-controller` on one or two phones.
4. Verify: birds appear, D-pad moves them, food collection increments score on canvas and on phone, timer counts down to 0, overlay shows ranking.

If smoke test passes, the next feature to add is a **round-restart flow**: when the overlay is showing on the display, have the server reset `junglePlayers` scores and emit a `jungle-round-reset` event so the display can call `initGame()` again without a page reload.

## 5. Decisions that differ from the spec (no CLAUDE.md exists)

- **`useJungle.js` imports `socket` directly** rather than receiving it as a parameter. The spec says "emit via socket" but does not specify injection style; direct import matches the pattern used in the existing `useTetris.js` and `ControllerView.vue`.
- **`JungleCanvas.vue` runs its own rAF loop** (reads `getBoardState` each frame) rather than being driven by the composable's loop. The spec says "no explicit call needed — the rAF loop in JungleCanvas reads state each frame", which is exactly what was implemented. The composable loop only updates state; the canvas loop only reads it.
- **`QRCodeDisplay.vue` was modified** — the spec lists it as an existing file to leave alone, then immediately says "add an optional `url` prop to `QRCodeDisplay.vue`" and calls this "the one small addition to an existing component that is acceptable." The change is strictly additive (one new optional prop, default preserves all existing behaviour).
