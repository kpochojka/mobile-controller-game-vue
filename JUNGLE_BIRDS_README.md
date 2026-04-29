# Jungle Birds

A multiplayer browser game where each player controls a bird on a shared screen using their phone. Collect tropical fruit to score points before time runs out.

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
                                           [JungleView.vue /jungle]
                                     moves the matching bird on the shared canvas
```

- The **game screen** (`/jungle`) runs on a computer, TV, or projector — everyone can see it.
- Each **phone** (`/jungle-controller`) controls one independent bird.
- Up to 8 bird types are assigned automatically as players join; more than 8 players cycle through the pool again.
- The round lasts **60 seconds**. When time expires, a ranking screen appears on the main display and all phones show a game-over message.

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
http://localhost:3000/jungle
```

**Players join from their phones** — the game screen shows a QR code in the top-left corner. Phones must be on the same Wi-Fi network as the computer running the server.

If `localhost` does not resolve on phones (common on some networks), set the `VITE_CONTROLLER_ORIGIN` variable so the QR code points to your machine's local IP:

```bash
# .env.development  (copy from .env.example)
VITE_CONTROLLER_ORIGIN=http://192.168.1.42:3000
```

Replace `192.168.1.42` with the actual local IP of your machine (`ipconfig` on Windows, `ifconfig` / `ip a` on Linux/macOS).

---

## Starting the game — deployed (Railway / Render)

No extra steps. The server serves the built Vue app and the QR code URL is derived from `window.location.origin` automatically, so it will point to your public domain.

Both routes are live as soon as the app is deployed:

| URL | Purpose |
|---|---|
| `https://your-app.up.railway.app/jungle` | Game screen (open on TV / laptop) |
| `https://your-app.up.railway.app/jungle-controller` | Controller (players scan QR) |

---

## Playing the game

### On the game screen (`/jungle`)

- The canvas shows the jungle arena with all birds flying simultaneously.
- Tropical fruit items (🍌🥭🍍🍓🫐🍇🍒🌺🪲🥝) appear at random positions.
- Each bird has the player's name and current score displayed below it.
- A countdown timer is shown in the top-right corner.
- The scoreboard on the right shows live rankings.
- When the timer hits `0:00`, a ranking overlay appears with 🥇🥈🥉 medals.

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

After the round ends, reload the game screen (`/jungle`) to reset and start again. Players do not need to reload their controller pages — they can scan the QR code again or simply refresh.

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

## Routes

| Path | File | Description |
|---|---|---|
| `/jungle` | `src/views/JungleView.vue` | Game display (computer/TV) |
| `/jungle-controller` | `src/views/JungleControllerView.vue` | Phone controller |

The Tetris game (`/` and `/controller`) is unaffected and runs in the same server process.
