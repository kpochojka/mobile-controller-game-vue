# Tetris Phone Controller — Agent Development Guide

This document is written for an AI agent (or developer) who is continuing the development of this application. It describes the full architecture, every file's responsibility, all data flows, and contains specific guidance on how to safely extend the codebase.

---

## What this application does

A Tetris game is displayed on a computer or TV screen. Players scan a QR code shown on the game screen with their phone. The phone opens a mobile-optimized controller interface in the browser. Touch inputs on the phone are transmitted in real time to the game display via WebSockets, controlling the Tetris pieces. Multiple phones can connect simultaneously — all of them control the same game.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js + Express | Simple HTTP server |
| Real-time comms | Socket.io v4 | WebSocket abstraction, works across all networks |
| Frontend framework | Vue 3 (Composition API) | Component-based, composables for reusable logic |
| Build tool | Vite 5 | Fast dev server, proxy support, ESM-native |
| Routing | Vue Router 4 | `/ ` = game display, `/controller` = phone UI |
| QR generation | `qrcode` npm package | Server-independent, runs in browser |
| Canvas rendering | HTML5 Canvas + `requestAnimationFrame` | Smooth 60fps game rendering |

---

## Repository structure

```
tetris-vue/
│
├── server.js                   ← Node.js backend (Socket.io relay + Express static server)
├── package.json                ← Dependencies + npm scripts
├── vite.config.js              ← Vite config (dev proxy for Socket.io)
├── index.html                  ← Vite HTML entry point
│
└── src/
    ├── main.js                 ← Vue app bootstrap
    ├── App.vue                 ← Root component (just <RouterView />)
    ├── socket.js               ← Socket.io-client singleton
    │
    ├── router/
    │   └── index.js            ← Route definitions
    │
    ├── composables/
    │   └── useTetris.js        ← ALL game logic (the core of the application)
    │
    ├── components/
    │   ├── TetrisBoard.vue     ← Canvas rendering (reads from useTetris, draws every frame)
    │   ├── NextPiece.vue       ← Canvas for next piece preview
    │   ├── ScorePanel.vue      ← Score / Level / Lines display + NextPiece
    │   ├── QRCodeDisplay.vue   ← QR code image + controller count badge
    │   └── GameOverlay.vue     ← Game Over screen (full-screen overlay)
    │
    └── views/
        ├── GameView.vue        ← Game display page (/ route) — orchestrator
        └── ControllerView.vue  ← Phone controller page (/controller route)
```

---

## Architecture overview

```
┌──────────────────────────────────────────────────────────┐
│                        server.js                         │
│                                                          │
│  Express serves dist/ (built Vue app)                    │
│                                                          │
│  Socket.io rooms:                                        │
│  - displaySocket  (one socket, the game screen)          │
│  - controllerSockets  (Set, all connected phones)        │
│                                                          │
│  Message relay:                                          │
│  phone → 'control' event → server → displaySocket        │
└──────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ WebSocket                    │ WebSocket
         │                              │
┌────────┴──────────┐       ┌──────────┴──────────┐
│  GameView.vue     │       │  ControllerView.vue  │
│  route: /         │       │  route: /controller  │
│                   │       │                      │
│  registers as     │       │  registers as        │
│  'display'        │       │  'controller'        │
│                   │       │                      │
│  receives:        │       │  sends:              │
│  'control'        │       │  'control' events    │
│  events and       │       │  { action: string }  │
│  calls game       │       │                      │
│  methods          │       │  actions:            │
│                   │       │  'left', 'right',    │
│  uses useTetris() │       │  'down', 'rotate',   │
│  composable       │       │  'drop', 'start'     │
└───────────────────┘       └──────────────────────┘
```

---

## Data flow: phone button press → piece moves

1. User touches a button in `ControllerView.vue`
2. `socket.emit('control', { action: 'left' })` is called
3. `server.js` receives the `'control'` event and runs `displaySocket.emit('control', data)`
4. `GameView.vue` receives `'control'` event, reads `action`
5. `GameView.vue` calls `moveLeft()` from `useTetris()`
6. `useTetris.js` mutates `currentPiece.x -= 1` (plain JS variable, not reactive)
7. `TetrisBoard.vue` is running a `requestAnimationFrame` loop, calling `getBoardState()` every frame
8. `getBoardState()` returns the current `board`, `currentPiece`, and `ghostY`
9. Canvas is cleared and redrawn with the updated piece position

---

## The composable: `src/composables/useTetris.js`

This is the most important file. All game logic lives here. It uses a **hybrid reactivity pattern**:

### Reactive refs (Vue) — for template bindings
```js
const score    = ref(0)   // displayed in ScorePanel
const level    = ref(1)   // displayed in ScorePanel
const lines    = ref(0)   // displayed in ScorePanel
const gameOver = ref(false) // controls GameOverlay visibility
const nextType = ref('T') // drives NextPiece canvas
```
These are returned and used in Vue templates with `{{ score }}` etc. Vue updates the DOM automatically when they change.

### Plain JS variables — for canvas (read via getBoardState)
```js
let board        = []     // 2D array [ROWS][COLS], cell = null | piece type string
let currentPiece = null   // { type, shape, x, y }
let dropTimer    = null   // setInterval handle
```
These are **not reactive**. The canvas draws them every frame via `requestAnimationFrame`, so they don't need to be reactive — updating them via Vue's reactivity system would be wasteful overhead.

### Key internal functions

**`collides(shape, ox, oy)`** — Returns `true` if the given shape placed at (ox, oy) would overlap the board boundaries or an existing locked cell. Used before every move.

**`rotate(shape)`** — Returns a new matrix that is the input rotated 90° clockwise. Pure function.

**`ghostY()`** — Calculates the lowest Y position the current piece can fall to without collision. Used to draw the ghost piece.

**`lockPiece()`** — Stamps `currentPiece` into the `board` array, then calls `clearLines()` and `spawnPiece()`.

**`clearLines()`** — Scans `board` bottom-to-top, removes full rows, unshifts empty rows at top. Updates `lines`, `score`, `level`, and calls `restartLoop()` to adjust drop speed.

**`restartLoop()`** — Clears and restarts `setInterval(tick, interval)` where `interval = Math.max(100, 800 - (level - 1) * 70)`. At level 1: 800ms. At level 8: 310ms. At level 11+: 100ms (minimum).

**`getBoardState()`** — The bridge between the game engine and the canvas. Returns `{ board, currentPiece, ghostY }`. Called on every animation frame by `TetrisBoard.vue`.

### Exported public API
```js
return {
  // Vue-reactive (for templates)
  score, level, lines, gameOver, nextType,
  // Control methods (called from GameView on socket events / keyboard)
  moveLeft, moveRight, softDrop, doRotate, hardDrop, initGame,
  // Canvas access
  getBoardState
}
```

---

## Canvas rendering: `src/components/TetrisBoard.vue`

Uses `requestAnimationFrame` loop started in `onMounted`, cancelled in `onUnmounted`:

```js
function loop() {
  draw()
  animId = requestAnimationFrame(loop)
}
onMounted(() => { animId = requestAnimationFrame(loop) })
onUnmounted(() => cancelAnimationFrame(animId))
```

Each frame:
1. Fill background `#0a0a1a`
2. Draw faint grid lines
3. Draw all locked cells from `board[r][c]` using `COLORS[type]`
4. Draw ghost piece at `ghostY` with 18% opacity
5. Draw active `currentPiece` at full opacity

`drawBlock(ctx, x, y, color, alpha)` draws one block with a highlight edge (top/left lighter) and shadow edge (bottom/right darker) for a 3D look.

---

## Routing

Vue Router is configured in `src/router/index.js` with `createWebHistory()` (clean URLs, no `#`).

| URL | Component | Purpose |
|---|---|---|
| `/` | `GameView.vue` | Game display (open on monitor/TV) |
| `/controller` | `ControllerView.vue` | Phone controller (opened via QR code) |

The server handles SPA routing with a wildcard fallback:
```js
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
```
This means both `/` and `/controller` return the same `index.html`, and Vue Router takes over client-side.

---

## Socket.io event reference

### Client → Server

| Event | Payload | Sender | Description |
|---|---|---|---|
| `register-display` | none | GameView | Identifies this socket as the game screen |
| `register-controller` | none | ControllerView | Identifies this socket as a phone controller |
| `control` | `{ action: string }` | ControllerView | A player input action |

### Server → Client

| Event | Payload | Receiver | Description |
|---|---|---|---|
| `display-ready` | `{ controllers: number }` | GameView | Sent after display registers; current controller count |
| `controller-ready` | none | ControllerView | Confirms controller registration |
| `controller-update` | `{ count: number }` | GameView | Sent whenever a controller connects or disconnects |
| `control` | `{ action: string }` | GameView | Relayed from a controller |

### Action strings (in `control` event payload)

| `action` | Effect |
|---|---|
| `'left'` | Move piece left |
| `'right'` | Move piece right |
| `'down'` | Soft drop (move one row down, +1 score) |
| `'rotate'` | Rotate piece 90° clockwise (with wall kicks) |
| `'drop'` | Hard drop (piece falls to bottom instantly, +2 per row) |
| `'start'` | Restart game (only handled when `gameOver === true`) |

---

## Server architecture: `server.js`

The server is intentionally stateless with respect to game logic — it knows nothing about Tetris. It only routes Socket.io messages.

```js
let displaySocket = null          // the one game screen
const controllerSockets = new Set() // all connected phones
```

On `'control'` event, the server simply does:
```js
if (displaySocket) displaySocket.emit('control', data)
```

**Important limitation:** Currently the server supports only one active game at a time. If you need multi-room support (multiple simultaneous games), you will need to introduce room IDs. See "Extension guides" below.

---

## Dev workflow

### Running locally (two terminals required)

```bash
# Terminal 1 — backend
node server.js          # runs on port 3000

# Terminal 2 — frontend
npm run dev:client      # Vite dev server on port 5173
```

Open `http://localhost:5173` on the computer. The Vite proxy in `vite.config.js` forwards all `/socket.io` requests to port 3000:
```js
proxy: {
  '/socket.io': { target: 'http://localhost:3000', ws: true }
}
```
This is only needed in development. In production, both are served from the same Express server on one port.

### Building for production

```bash
npm run build   # runs vite build → outputs to dist/
npm start       # starts Express, serves dist/
```

`postinstall` in `package.json` runs `npm run build` automatically after `npm install`, so Railway/Render deployments work without extra build commands.

---

## Extension guides

### Adding a new control action

1. Add a button in `src/views/ControllerView.vue` that calls `send('your-action')`
2. Add a handler in `src/views/GameView.vue` in the `socket.on('control', ...)` block
3. Add the corresponding method in `src/composables/useTetris.js` and include it in the returned API

### Adding a new screen (e.g. main menu, leaderboard)

1. Create `src/views/YourView.vue`
2. Add the route in `src/router/index.js`:
   ```js
   { path: '/your-path', component: YourView }
   ```
3. Navigate using `<RouterLink to="/your-path">` or programmatically with `useRouter().push('/your-path')`

### Adding a new UI panel to the game screen

1. Create `src/components/YourPanel.vue`
2. Import and add it to `src/views/GameView.vue`
3. Pass any data it needs as props from `useTetris()` return values

### Adding persistent state (e.g. high score)

The game currently has no persistence. To add it:
- Use `localStorage` in `GameView.vue` — watch `score` and write on game over
- Or add a database (e.g. SQLite via `better-sqlite3`) to `server.js` and expose an HTTP endpoint

### Adding multi-room support (multiple simultaneous games)

The server currently has a single `displaySocket`. To support multiple games:
1. Generate a room ID when a display connects (`crypto.randomUUID()`)
2. Send the room ID back to the display
3. Embed the room ID in the QR code URL: `/controller?room=<id>`
4. In `ControllerView.vue`, read the room ID from `useRoute().query.room`
5. Send `register-controller` with `{ roomId }` payload
6. In `server.js`, replace `displaySocket`/`controllerSockets` with a `Map<roomId, { display, controllers }>`

### Adding a second player / competitive mode

1. Extend the `control` event payload with a `playerId` field
2. In `useTetris.js`, add a second board and piece state
3. Have `TetrisBoard.vue` accept a `playerId` prop and render only one board

---

## Board data structure

`board` is a plain JavaScript 2D array with dimensions `[ROWS][COLS]` = `[20][10]`.

Each cell is either:
- `null` — empty cell
- A string key of a piece type: `'I'`, `'O'`, `'T'`, `'S'`, `'Z'`, `'J'`, or `'L'`

The cell value is used to look up the color in the `COLORS` object when drawing.

## Piece data structure

`currentPiece` is a plain JS object:
```js
{
  type:  'T',              // string key, used for color lookup
  shape: [[0,1,0],         // 2D array of 0/1, changes on rotation
           [1,1,1],
           [0,0,0]],
  x:     4,               // column of top-left corner of shape bounding box
  y:     0                // row of top-left corner of shape bounding box
}
```

---

## Known limitations and technical debt

- **Single game session:** Only one game display at a time. If a second browser opens `/`, it overwrites `displaySocket` on the server.
- **No piece bag / 7-bag randomizer:** Pieces are selected with `Math.random()`. Standard Tetris uses a "7-bag" system (each set of 7 pieces contains all types exactly once). This can cause long droughts of a specific piece.
- **No T-spin detection:** The wall kick system uses simple offsets `[0, -1, 1, -2, 2]` — enough to handle most rotations, but T-spins are not rewarded with bonus points.
- **No hold piece:** Standard modern Tetris includes a hold queue. Not implemented.
- **No sound:** No audio feedback on piece lock, line clear, or game over.
- **Controller repeat rate is fixed:** Left/right repeat starts after 280ms, repeats every 80ms. These are hardcoded in `ControllerView.vue`.

---

## Color and style reference

Background color: `#0a0a1a` (near-black blue)
Accent color: `#00d4ff` (cyan — used for title, QR glow, controller count)
Game over color: `#ff4466` (red-pink)

Piece colors are defined in `COLORS` in `useTetris.js` and are exported — use the same object wherever you need to reference piece colors (e.g. in a new statistics panel).
