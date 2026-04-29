# Agent Specification: Jungle Birds Game

> **Note:** This document described adding Jungle Birds alongside Tetris. The Tetris game has since been **removed** from the repo; the codebase is Jungle-only. Keep this file as a design reference; ignore instructions about not modifying Tetris files.

## Your task (historical)

Add a second game — **Jungle Birds** — to the existing `tetris-vue` project. Do not touch any existing Tetris files. Add new files only, then update two existing files (`server.js` and `src/router/index.js`) with minimal, additive changes.

---

## Current project state

The project already exists and is fully working. Here is what is already in place:

**Tech stack:** Vue 3 (Composition API) + Vite 5 + Vue Router 4 + Socket.io v4 + Node.js/Express.

**Existing file tree (do not modify these files):**
```
tetris-vue/
  server.js                        ← needs 2 additive changes (see below)
  package.json                     ← no changes needed
  vite.config.js                   ← no changes needed
  index.html                       ← no changes needed
  src/
    main.js                        ← no changes needed
    App.vue                        ← no changes needed
    socket.js                      ← no changes needed, reuse as-is
    router/index.js                ← needs 2 new routes added
    composables/useTetris.js       ← do not touch
    components/TetrisBoard.vue     ← do not touch
    components/NextPiece.vue       ← do not touch
    components/ScorePanel.vue      ← do not touch
    components/QRCodeDisplay.vue   ← do not touch
    components/GameOverlay.vue     ← do not touch
    views/GameView.vue             ← do not touch
    views/ControllerView.vue       ← do not touch
```

**Existing Socket.io architecture in `server.js`:**
The server currently has a single-game model: one `displaySocket` (the game screen) and a `Set` of `controllerSockets` (phones). The Tetris game uses these Socket.io events:
- Client → Server: `register-display`, `register-controller`, `control`
- Server → Client: `display-ready`, `controller-ready`, `controller-update`, `control`

**Existing routes in `src/router/index.js`:**
- `/` → `GameView.vue` (Tetris display)
- `/controller` → `ControllerView.vue` (Tetris phone controller)

---

## What to build

A jungle-themed multiplayer game where each connected phone controls an independent bird flying around a shared screen collecting food. No conflict between players — each controls their own bird. Timed round of 120 seconds, then a ranking screen is shown.

### Game concept summary
- The shared game screen (`/jungle`) shows a jungle canvas with all birds flying simultaneously
- Each phone (`/jungle-controller`) controls one bird independently via a 4-directional D-pad
- Food items (tropical fruits) appear at random positions on the canvas
- When a bird touches a food item, it collects it (+score for that player)
- After 120 seconds the game ends and a ranking is displayed on the main screen
- The phone controller shows the player's own score and their assigned bird in real time

---

## Files to create (new files only)

```
src/
  composables/
    useJungle.js                   ← all game logic
  views/
    JungleView.vue                 ← game display page (/ jungle route)
    JungleControllerView.vue       ← phone controller (/jungle-controller route)
  components/
    JungleCanvas.vue               ← Canvas + rAF render loop
    JungleScoreboard.vue           ← live score list during game
    JungleOverlay.vue              ← end-of-round ranking screen
```

---

## Existing files to modify (minimal changes only)

### 1. `src/router/index.js`
Add two new imports and two new routes. Do not change existing routes.

```js
import JungleView           from '../views/JungleView.vue'
import JungleControllerView from '../views/JungleControllerView.vue'

// add to routes array:
{ path: '/jungle',            component: JungleView },
{ path: '/jungle-controller', component: JungleControllerView }
```

### 2. `server.js`
The server must support two independent game sessions simultaneously: one Tetris session (already exists) and one Jungle session (new). 

Add a parallel set of socket state variables for the Jungle game and handle the new events. Do not change how Tetris events work.

**New state to add:**
```js
let jungleDisplaySocket = null
const junglePlayers = new Map() // socket.id → { id, bird, score, name }
```

**New Socket.io events to handle** (add inside the existing `io.on('connection', ...)` block):

`register-jungle-display` — emitted by JungleView on mount.
- Set `jungleDisplaySocket = socket`
- Emit back `jungle-display-ready` with current player list

`register-jungle-player` — emitted by JungleControllerView on mount.
- Assign a bird from the pool (see bird list below) that is not yet taken
- Assign a display name = bird's common name
- Store in `junglePlayers` map: `{ id: socket.id, bird, score: 0, name }`
- Emit `jungle-player-ready` back to controller with `{ id, bird, name }`
- Emit `jungle-player-joined` to jungleDisplaySocket with full updated player list

`jungle-control` — emitted by phone when player moves. Payload: `{ action }` where action is one of `'up' | 'down' | 'left' | 'right' | 'stop-x' | 'stop-y'`
- Relay to jungleDisplaySocket as `jungle-control` with payload `{ playerId: socket.id, action }`

`jungle-score-update` — emitted by JungleView when a collection happens. Payload: `{ playerId, score }`
- Update `junglePlayers.get(playerId).score = score`
- Relay `jungle-score-update` to jungleDisplaySocket (for scoreboard) and to the specific controller socket (so phone shows own score)

`jungle-game-end` — emitted by JungleView when 120s timer ends. No payload needed from client.
- Compile final ranking from `junglePlayers` map, sorted by score descending
- Emit `jungle-final-ranking` to jungleDisplaySocket with `{ ranking: [...] }`
- Emit `jungle-game-over` to all jungle controller sockets

On `disconnect`:
- If `jungleDisplaySocket?.id === socket.id` → set `jungleDisplaySocket = null`
- If `junglePlayers.has(socket.id)` → delete from map, emit `jungle-player-left` to jungleDisplaySocket with updated list

**Bird pool** (assign in order as players join, cycle if more than 8 players):
```js
const BIRD_POOL = [
  { emoji: '🦜', name: 'Parrot' },
  { emoji: '🦚', name: 'Peacock' },
  { emoji: '🦩', name: 'Flamingo' },
  { emoji: '🦆', name: 'Duck' },
  { emoji: '🦅', name: 'Eagle' },
  { emoji: '🦉', name: 'Owl' },
  { emoji: '🐦', name: 'Toucan' },
  { emoji: '🕊️', name: 'Dove' },
]
let birdIndex = 0  // increment on each register-jungle-player, mod BIRD_POOL.length
```

---

## `src/composables/useJungle.js` — full spec

This composable manages all client-side game state. It follows the same hybrid pattern as `useTetris.js`: Vue refs for template bindings, plain JS objects for canvas rendering.

### Constants
```js
const CANVAS_W = 900    // canvas width in px
const CANVAS_H = 600    // canvas height in px
const BIRD_SPEED = 3    // px per frame when moving
const BIRD_SIZE = 36    // emoji render size in px
const FOOD_SIZE = 28    // food emoji render size
const FOOD_COUNT = 12   // max food items on screen at once
const ROUND_DURATION = 120  // seconds
```

### Food items pool
```js
const FOOD_POOL = ['🍌','🥭','🍍','🍓','🫐','🍇','🍒','🌺','🪲','🥝']
```
Food is randomly chosen from this array each time a new food item spawns.

### Player object structure (plain JS, stored in a Map)
```js
{
  id: string,          // socket.id
  bird: { emoji, name },
  x: number,           // current x position on canvas (center of bird)
  y: number,           // current y position on canvas
  vx: number,          // velocity x (-BIRD_SPEED, 0, or BIRD_SPEED)
  vy: number,          // velocity y
  score: number,
  name: string
}
```

### Food item object structure
```js
{
  id: string,           // unique id (Math.random())
  emoji: string,
  x: number,
  y: number,
  collected: false
}
```

### Composable internal state
```js
// Plain JS (canvas reads these)
let players = new Map()   // playerId → player object
let foods = []            // array of food objects

// Vue refs (template bindings)
const timeLeft    = ref(120)
const gameActive  = ref(false)
const gameEnded   = ref(false)
const myScore     = ref(0)       // score of the local player (for controller view)
const playerList  = ref([])      // array of { id, name, bird, score } for scoreboard
```

### Functions to implement

**`initGame()`**
- Reset all state: clear `players` Map, clear `foods` array
- Reset refs: `timeLeft = 120`, `gameActive = true`, `gameEnded = false`
- Spawn initial food items (spawn `FOOD_COUNT` food items at random positions, keeping 40px margin from edges)
- Start the game loop via `requestAnimationFrame`
- Start the countdown timer via `setInterval` every 1 second decrementing `timeLeft`. When `timeLeft` reaches 0: set `gameActive = false`, set `gameEnded = true`, stop the loop, emit `jungle-game-end` via socket

**`addPlayer(playerData)`** — called when server sends `jungle-player-joined`
- `playerData` = `{ id, bird, name, score }`
- Add to `players` Map with initial position: random x in [100, CANVAS_W-100], random y in [100, CANVAS_H-100], vx=0, vy=0
- Sync `playerList` ref

**`removePlayer(playerId)`** — called when server sends `jungle-player-left`
- Delete from `players` Map
- Sync `playerList` ref

**`applyControl(playerId, action)`** — called when server relays `jungle-control`
- Find player in `players` Map
- Apply velocity:
  - `'left'`   → `player.vx = -BIRD_SPEED`
  - `'right'`  → `player.vx = BIRD_SPEED`
  - `'up'`     → `player.vy = -BIRD_SPEED`
  - `'down'`   → `player.vy = BIRD_SPEED`
  - `'stop-x'` → `player.vx = 0`
  - `'stop-y'` → `player.vy = 0`

**`gameLoop()`** — called every animation frame when `gameActive` is true
- For each player: update position (`x += vx`, `y += vy`), clamp to canvas bounds (keep bird fully inside: min = BIRD_SIZE/2, max = CANVAS_W - BIRD_SIZE/2)
- Check collision between each player and each food item:
  - Collision if distance between centers < (BIRD_SIZE/2 + FOOD_SIZE/2)
  - On collision: remove food from `foods` array, increment `player.score`, sync `playerList` ref, emit `jungle-score-update` via socket with `{ playerId, score: player.score }`
  - Spawn a new food item to replace the collected one (keep total count at FOOD_COUNT)
- Trigger canvas redraw (no explicit call needed — the rAF loop in JungleCanvas reads state each frame)

**`spawnFood()`** — creates one food object at random position
- Random x in [FOOD_SIZE, CANVAS_W - FOOD_SIZE]
- Random y in [FOOD_SIZE, CANVAS_H - FOOD_SIZE]
- Random emoji from FOOD_POOL
- Push to `foods` array

**`getBoardState()`** — returns `{ players, foods }` for canvas rendering (same pattern as useTetris)

**`syncPlayerList()`** — private helper, rebuilds `playerList` ref from `players` Map:
```js
playerList.value = [...players.values()].map(p => ({ id: p.id, name: p.name, bird: p.bird, score: p.score }))
```

### Returned API
```js
return {
  timeLeft, gameActive, gameEnded, myScore, playerList,
  initGame, addPlayer, removePlayer, applyControl,
  getBoardState
}
```

---

## `src/components/JungleCanvas.vue` — full spec

Canvas component. Same rAF loop pattern as TetrisBoard.vue.

**Canvas size:** 900×600px (matches CANVAS_W × CANVAS_H from composable).

**Draw order each frame:**

1. Background: fill entire canvas with `#1a4a1a` (dark jungle green)

2. Background decoration (draw before birds):
   - Draw ~8 static "leaf" patches using filled ellipses in `#2d6e2d` scattered at fixed positions (hardcode the positions — no random per frame). This gives the jungle floor texture without any image assets.

3. Food items: for each food in `foods` array, draw the emoji at `(food.x, food.y)`. Use `ctx.font = '28px serif'`, `ctx.textAlign = 'center'`, `ctx.textBaseline = 'middle'`.

4. Birds: for each player in `players` Map:
   - Draw the bird emoji at `(player.x, player.y)`. Use `ctx.font = '36px serif'`
   - Below the bird, draw the player name. Use `ctx.font = 'bold 12px sans-serif'`, `ctx.fillStyle = '#ffffff'`, white text with a dark shadow for readability (`ctx.shadowColor = '#000'`, `ctx.shadowBlur = 4`)
   - Below the name, draw the score: `ctx.fillStyle = '#ffff00'` (yellow), same font

5. HUD (draw last, on top):
   - Top-right: countdown timer. Large text, white, e.g. `ctx.font = 'bold 32px sans-serif'`. Format as `0:45`
   - If `gameActive === false` and `gameEnded === true`: do not draw anything special on canvas (the overlay component handles it)

**Props received:** `{ getBoardState: Function, timeLeft: Number, gameActive: Boolean }`

---

## `src/views/JungleView.vue` — full spec

The game display page, opened on the computer/TV screen.

**Template layout** (CSS flex row, full viewport height):
- Left column: QR code pointing to `/jungle-controller` + controller count. Reuse the existing `QRCodeDisplay.vue` component, pass `:controllerCount="playerList.length"` — but generate the QR code URL as `window.location.origin + '/jungle-controller'`. Since `QRCodeDisplay.vue` hardcodes the URL internally, you may need to either: (a) make a local copy of QRCode generation inline in JungleView, or (b) pass a `url` prop to QRCodeDisplay if you add one. Prefer option (b) — add an optional `url` prop to `QRCodeDisplay.vue` with a default fallback to `/controller`. This is the one small addition to an existing component that is acceptable.
- Center: `JungleCanvas` component
- Right column: `JungleScoreboard` component showing live scores

**Script setup:**
- Import and use `useJungle()` composable
- Import `socket` from `../socket.js`
- On mount: emit `register-jungle-display`, listen for:
  - `jungle-display-ready` → call `initGame()`, then for each player in payload call `addPlayer()`
  - `jungle-player-joined` → call `addPlayer()` with new player data
  - `jungle-player-left` → call `removePlayer()`
  - `jungle-control` → call `applyControl(playerId, action)`
  - `jungle-score-update` → update player score in composable (or let composable handle it — just relay to `applyScoreUpdate(playerId, score)` which updates `players` Map and syncs `playerList` ref)
  - `jungle-final-ranking` → store ranking, show `JungleOverlay`
- On unmount: remove all socket listeners, call `socket.off('...')` for each

**Show `JungleOverlay`** when `gameEnded === true`, passing the final ranking as a prop.

---

## `src/views/JungleControllerView.vue` — full spec

Phone controller page. Mobile-optimized, full screen, touch-based.

**Layout:**
- Status bar at top (same pattern as existing ControllerView.vue): connection dot + status text
- Bird display section: show the assigned bird emoji large (64px) + bird name + current score
- D-pad section: 4 directional buttons arranged in a cross/plus shape

**D-pad interaction model:**
Use `touchstart`/`touchend` (not `click`) for responsiveness. On button touchstart: emit `jungle-control` with `{ action: 'left' | 'right' | 'up' | 'down' }`. On touchend of that button: emit `jungle-control` with `{ action: 'stop-x' }` for left/right buttons, or `{ action: 'stop-y' }` for up/down buttons. This gives smooth movement that stops when finger lifts.

**D-pad layout** (CSS grid, 3×3, center cell empty):
```
     [  up  ]
[left] [   ] [right]
     [ down ]
```
Each button: 80×80px, rounded, dark jungle green background (`#2d6e2d`), white arrow text.

**Script setup:**
- On mount: emit `register-jungle-player`
- Listen for `jungle-player-ready`: store `{ id, bird, name }` in local refs, set `connected = true`
- Listen for `jungle-score-update` where `playerId === myId`: update local `score` ref
- Listen for `jungle-game-over`: show "Game over" message on controller, hide D-pad

**Prevent default on all touch events** to avoid scroll/zoom interference.

---

## `src/components/JungleScoreboard.vue` — full spec

Simple live leaderboard shown on the right side of the game screen.

**Props:** `{ players: Array }` — array of `{ id, name, bird, score }`, already sorted by score descending (sort in the template with `computed`)

**Template:**
- Title: "🌿 Scores"
- List of players, each row: `[bird.emoji] [name] — [score]`
- Highlight the top player (first in sorted list) with a different background
- Style: dark semi-transparent background cards, white text, jungle green accents

---

## `src/components/JungleOverlay.vue` — full spec

Full-screen overlay shown at game end with final ranking.

**Props:** `{ show: Boolean, ranking: Array }` — ranking is array of `{ name, bird, score }` sorted by score descending

**Template:**
- `<Transition name="fade">` wrapper
- Large "🌴 Time's Up! 🌴" heading
- Podium-style list: 🥇 1st, 🥈 2nd, 🥉 3rd, then the rest
- Each entry: `[medal/number] [bird.emoji] [name] — [score] pts`
- "Scan the QR code to play again" hint at bottom

---

## Visual theme reference

| Element | Value |
|---|---|
| Canvas background | `#1a4a1a` |
| Leaf patches | `#2d6e2d` |
| HUD text | `#ffffff` |
| Score text on canvas | `#ffff00` |
| D-pad button bg | `#2d6e2d` |
| D-pad button text | `#ffffff` |
| Controller screen bg | `#0d2e0d` |
| Scoreboard bg | `rgba(0,0,0,0.4)` on top of page bg |
| Page background (body) | already set to `#0a0a1a` in App.vue global styles |

---

## Socket.io events — complete reference for Jungle game

| Event | Direction | Payload | Description |
|---|---|---|---|
| `register-jungle-display` | client→server | none | JungleView registers as display |
| `register-jungle-player` | client→server | none | Phone registers as player |
| `jungle-control` | client→server | `{ action }` | Directional input from phone |
| `jungle-score-update` | client→server | `{ playerId, score }` | Display tells server a collection happened |
| `jungle-game-end` | client→server | none | Display notifies server round ended |
| `jungle-display-ready` | server→client | `{ players: [] }` | Sent to display after registration |
| `jungle-player-ready` | server→client | `{ id, bird, name }` | Sent to controller after registration |
| `jungle-player-joined` | server→display | `{ players: [] }` | Updated full player list |
| `jungle-player-left` | server→display | `{ players: [] }` | Updated full player list |
| `jungle-control` | server→display | `{ playerId, action }` | Relayed input |
| `jungle-score-update` | server→display+controller | `{ playerId, score }` | Score change |
| `jungle-final-ranking` | server→display | `{ ranking: [] }` | End-of-round ranking |
| `jungle-game-over` | server→controllers | none | Notifies phones game ended |

---

## Implementation order (recommended)

1. Modify `server.js` — add all jungle socket handlers
2. Modify `src/router/index.js` — add two routes
3. Create `src/composables/useJungle.js`
4. Create `src/components/JungleCanvas.vue`
5. Create `src/components/JungleScoreboard.vue`
6. Create `src/components/JungleOverlay.vue`
7. Create `src/views/JungleView.vue`
8. Create `src/views/JungleControllerView.vue`
9. Add optional `url` prop to existing `src/components/QRCodeDisplay.vue`
10. Run `npm run build` and verify no errors

---

## Constraints and rules

- Do not use any external game libraries (Phaser, PixiJS, etc.) — plain Canvas API only
- Do not use any image files — all visuals are emoji rendered on canvas via `ctx.fillText`
- Do not modify any Tetris files except the two listed above
- Do not add new npm dependencies — everything needed is already installed
- All new Vue files must use Composition API with `<script setup>` syntax
- All new components must handle their own `onUnmounted` cleanup (cancel rAF, clear intervals, remove socket listeners)
- The game must work with 1 player (solo testing) and scale to 8+ players without code changes
- Mobile controller must use `touchstart`/`touchend` with `e.preventDefault()` — not click events
