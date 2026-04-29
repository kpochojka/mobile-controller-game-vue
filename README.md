# Jungle Birds

A multiplayer browser game built with **Vue 3**, **Vite**, and **Socket.io**. Each player uses a phone as a controller; everyone watches the same screen (TV or laptop). Fly your bird, collect tropical fruit for points, and avoid monkeys before the round timer runs out.

## Game rules (short)

- **Goal:** Score as many points as you can before **time runs out** (120 seconds).
- **How to score:** Move your bird over **fruit** on the jungle floor to collect it. Fruit respawns after it is picked up or eaten by an NPC.
- **Sloth:** Slow obstacle that wanders and **eats fruit**; it does **not** reset your score.
- **Monkeys:** Faster obstacles; they steal fruit too. If your bird **touches a monkey**, your **score goes back to 0** (until you move away and touch again in a new “episode”).
- **Collision:** You cannot pass through the sloth or monkeys; they push you aside.
- **After the round:** A ranking appears on the main screen. **Reload the game page** to start a new round; players can stay on or refresh the controller page.

Phones must open **`/jungle-controller`** (or scan the QR on the game screen). The game display uses **`/`** or **`/jungle`**.

## How it works

Phones send D-pad input over Socket.io; **`server.js`** relays it to the display, which runs the simulation in **`useJungle.js`** and draws with **`JungleCanvas.vue`**.

## Quick start

```bash
npm install
npm run build
node server.js
```

Optional during development (live reload for the client; point `VITE_SOCKET_IO_TARGET` at the port printed by `server.js`):

```bash
VITE_SOCKET_IO_TARGET=http://localhost:3000 npm run dev:client
```

- **Game:** `http://localhost:3000/` (or your Vite URL in dev)
- **Controllers:** `/jungle-controller` on the same host

If phones on your LAN cannot use `localhost`, set **`VITE_CONTROLLER_ORIGIN`** in `.env.development` to your machine’s IP and dev port (see `.env.example`).

## Deploy (Railway, Render, etc.)

1. Push the repository to GitHub.
2. Create a Node service: **`npm install`** (runs **`postinstall`** → build) then **`npm start`**.
3. The platform sets **`PORT`**; the app listens on it automatically.
4. Open your public URL at **`/`** for the display and **`/jungle-controller`** on phones.

No need to set `VITE_CONTROLLER_ORIGIN` in production unless the QR must point at a different origin than the page.

## Project layout

```
server.js                    Express serves dist/ + Socket.io relay
src/
  router/index.js            Routes: /, /jungle, /jungle-controller
  views/JungleView.vue       Main display
  views/JungleControllerView.vue
  composables/useJungle.js   Movement, collisions, NPCs, scoring, timer
  components/JungleCanvas.vue
  components/JungleScoreboard.vue
  components/JungleOverlay.vue
  components/QRCodeDisplay.vue
public/design/background.png Jungle background (built into dist)
```

## More detail

See **[JUNGLE_BIRDS_README.md](./JUNGLE_BIRDS_README.md)** for arena size, NPC table, bird roster, and file references.
