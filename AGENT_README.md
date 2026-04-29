# Jungle Birds — Agent development guide

Browser game: **shared screen** + **phones** as controllers. Realtime relay via **Socket.io**; game simulation runs on the display client (`useJungle.js` + canvas).

## Stack

Vue 3, Vite 5, Vue Router 4, Express + Socket.io (Node), `socket.io-client` singleton in `src/socket.js`.

## Routes

| Path | Vue view | Role |
|------|-----------|------|
| `/`, `/jungle` | `JungleView.vue` | Registers `register-jungle-display`, shows QR + canvas |
| `/jungle-controller` | `JungleControllerView.vue` | `register-jungle-player`, emits `jungle-control` |

## Socket events (server relays)

**Display → server:** `register-jungle-display`  
**Phone → server:** `register-jungle-player`, `jungle-control`, (server also receives score/game end from display client)  
**Server → display:** `jungle-display-ready`, `jungle-player-joined`, `jungle-player-left`, `jungle-control`, `jungle-score-update`, `jungle-final-ranking`  
**Server → phone:** `jungle-player-ready`, `jungle-score-update`, `jungle-game-over`

## Core files

- `src/composables/useJungle.js` — movement, collisions, NPCs, scoring, timer; emits socket updates.
- `src/components/JungleCanvas.vue` — rAF render loop, reads board state from composable.
- `server.js` — jungle player map, bird assignment, event relay (no game logic).

## Local dev

Terminal 1: `node server.js` (note printed port). Terminal 2: `VITE_SOCKET_IO_TARGET=http://localhost:<port> npm run dev:client`. Optional: `.env.development` with `VITE_CONTROLLER_ORIGIN` (LAN IP + Vite port) so phone QR opens `/jungle-controller`.

## Deeper product spec

See `JUNGLE_BIRDS_README.md` and `JUNGLE_BIRDS_SPEC.md`.
