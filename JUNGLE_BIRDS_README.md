# Jungle Birds

A multiplayer browser game where each player controls a bird on a shared screen using their phone. Collect tropical fruit to score points before time runs out — while avoiding monkeys and competing with a slow sloth for the same pickups.

Built with **Vue 3 + Vite + Socket.io** — no extra dependencies beyond what the project already uses.

---

## How it works

```
[Phone /jungle-controller] ──touch D-pad──▶ socket.emit('jungle-control', { action })
                                                        │
                                                 [server.js relay]
                                                        │
                                            socket.emit('jungle-control', { playerId, action })
                                                        ▼
                                           [JungleView.vue / or /jungle]
                                     moves the matching bird on the shared canvas
```

- The **game screen** (`/` or `/jungle`) runs on a computer, TV, or projector — everyone can see it.
- Each **phone** (`/jungle-controller`) controls one independent bird.
- Up to 8 bird types are assigned automatically as players join; more than 8 players cycle through the pool again.
- The round lasts **60 seconds**. When time expires, a ranking screen appears on the main display and all phones show a game-over message.

---

## Arena & visuals

| | |
|---|---|
| **Playfield size** | **1280 × 740** px (internal canvas; CSS scales it to fit the window) |
| **Fruit on screen** | **18** items at a time (respawn when collected or eaten by NPCs) |
| **Background** | Full-bleed **raster image** (`public/design/background.png`, source art in `design/background.png`), drawn with aspect **cover**. A light vignette keeps birds, fruit, and HUD readable. |

The **QR block** (left), **arena** (center), and **live ranking** (right) use a responsive layout: wide screens keep three columns; narrower viewports stack the canvas first, with QR and scoreboard wrapping below — no horizontal scrolling on typical laptop widths.

---

## NPCs — sloth & monkeys

All of these roam using random **waypoints** (new target when they get close to the current one). They **never earn points**, but they **remove fruit** from the board (a new fruit spawns elsewhere). Birds **cannot pass through** them; overlapping circles push the bird aside.

| Entity | Behaviour |
|---|---|
| **Sloth** 🦥 | Slow mover. Larger hitbox (**68** px class). Steals fruit you were aiming for. |
| **Monkey 1 & 2** 🐒 | Faster than the sloth, smaller hitbox (**56** px class). Also steal fruit. |
| **Monkey danger** | If your bird **touches either monkey** (circles overlap), your **score resets to 0** for that overlap “episode”; you can lose points again after you move away and touch a monkey later. |

The sloth does **not** reset your score — only monkeys do.

---

## Starting the game — local network

You need two terminals.

```bash
# Terminal 1 — build the app and start the server
npm run build
node server.js
```

```bash
# Terminal 2 — (optional) Vite dev server for live-reload during development
npm run dev:client
```

For production-style play, only Terminal 1 is needed. The server listens on port `3000` by default (or the next free port if 3000 is busy).

**Open the game screen:**

```
http://localhost:3000/
```

(`/jungle` is the same view.) With the dev client (often port **5173**):

```
http://localhost:5173/
```

**Players join from their phones** — the game screen shows a QR code. Phones must be on the same Wi-Fi network as the computer running the server.

If `localhost` does not resolve on phones (common on some networks), set `VITE_CONTROLLER_ORIGIN` so the QR points at your machine’s IP and the right dev port (Vite is usually **5173**; a plain `node server.js` build is **3000**):

```bash
# .env.development  (see .env.example)
VITE_CONTROLLER_ORIGIN=http://192.168.1.42:5173
```

The QR URL appends `/jungle-controller` to this base. Replace `192.168.1.42` with your LAN IP (`ipconfig` / `ifconfig` / `ip a`).

### Background image in builds

The packaged app loads the image from **`/design/background.png`** (served from `public/design/` → copied to **`dist/design/`** on `npm run build`). If you replace **`design/background.png`**, copy the new file to **`public/design/background.png`** before building so production matches your art.

---

## Starting the game — deployed (Railway / Render)

No extra steps. The server serves the built Vue app and the QR code uses `window.location.origin` in `JungleView.vue`, so it points at your public domain — not values from `.env.development` (that file is only for local `npm run dev:client`). You normally **do not** set `VITE_CONTROLLER_ORIGIN` on Railway; leave it unset so the QR uses the live site origin.

Both routes are live as soon as the app is deployed:

| URL | Purpose |
|---|---|
| `https://your-app.up.railway.app/` or `.../jungle` | Game screen (open on TV / laptop) |
| `https://your-app.up.railway.app/jungle-controller` | Controller (players scan QR) |

---

## Playing the game

### On the game screen (`/` or `/jungle`)

- The canvas shows the jungle arena with all birds flying simultaneously.
- Tropical fruit items (🍌🥭🍍🍓🫐🍇🍒🌺🪲🥝) appear at random positions.
- Each bird shows its **current score above** it on the canvas (names appear in the sidebar ranking).
- A countdown timer appears in the top-right (**TIME LEFT** chip).
- The scoreboard shows **live ranking** beside the arena (layout adapts on small screens).
- A **sloth** and **two monkeys** move automatically, eat fruit, and block movement; monkeys reset a player's score on contact (see above).
- When the timer hits `0:00`, a ranking overlay appears with 🥇🥈🥉 style placement.

### On the phone (`/jungle-controller`)

1. Scan the QR code on the game screen — or navigate directly to `/jungle-controller`.
2. The app assigns a bird automatically and shows it on screen.
3. Use the **D-pad** to fly your bird around the canvas:
   - Tap and **hold** a direction to keep moving.
   - **Release** to stop on that axis.
4. Your live score is displayed above the D-pad.
5. When the round ends, the phone shows a game-over screen.

```
        [ ▲ ]
  [ ◀ ]       [ ▶ ]
        [ ▼ ]
```

---

## Starting a new round

After the round ends, reload the game screen (`/` or `/jungle`) to reset and start again. Players do not need to reload their controller pages — they can scan the QR code again or simply refresh.

---

## Bird roster

| Bird | Emoji |
|---|---|
| Parrot | 🦜 |
| Peacock | 🦚 |
| Flamingo | 🦩 |
| Duck | 🦆 |
| Eagle | 🦅 |
| Owl | 🦉 |
| Toucan | 🐦 |
| Dove | 🕊️ |

---

## Routes & main files

| Path | File | Description |
|---|---|---|
| `/`, `/jungle` | `src/views/JungleView.vue` | Game display (computer/TV); QR + scoreboard |
| `/jungle-controller` | `src/views/JungleControllerView.vue` | Phone controller |
| — | `src/components/JungleCanvas.vue` | Canvas rendering, background art, entities |
| — | `src/composables/useJungle.js` | Local simulation: movement, collisions, NPCs, scoring |
| — | `src/constants/jungleGame.js` | Canvas size and entity sizes |
