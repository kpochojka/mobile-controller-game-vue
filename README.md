# Tetris Vue — Phone Controller

Tetris sterowany telefonem przez QR kod. Zbudowany w **Vue 3 + Vite + Socket.io**.

## Struktura projektu

```
tetris-vue/
  server.js              ← Node.js + Socket.io (backend)
  vite.config.js         ← Vite + proxy dla dev
  src/
    main.js              ← punkt wejścia Vue
    App.vue              ← root komponent
    socket.js            ← singleton Socket.io-client
    router/
      index.js           ← / → GameView, /controller → ControllerView
    composables/
      useTetris.js       ← cała logika gry (reużywalny)
    components/
      TetrisBoard.vue    ← canvas + rAF pętla rysowania
      NextPiece.vue      ← podgląd następnego klocka
      ScorePanel.vue     ← wynik / poziom / linie
      QRCodeDisplay.vue  ← QR kod + licznik kontrolerów
      GameOverlay.vue    ← ekran Game Over
    views/
      GameView.vue       ← widok wyświetlacza (TV/monitor)
      ControllerView.vue ← widok kontrolera (telefon)
```

## Uruchomienie lokalne (dev)

Potrzebujesz dwóch terminali:

```bash
# Terminal 1 — serwer Socket.io
node server.js

# Terminal 2 — Vite dev server
npm run dev:client
```

Otwórz `http://localhost:5173` na komputerze.
Zeskanuj QR kod telefonem (musi być ta sama sieć Wi-Fi).

## Deploy na Railway

1. Wgraj folder na GitHub
2. Zaloguj się na https://railway.app → **New Project → Deploy from GitHub**
3. Railway automatycznie uruchomi `npm install` (co odpala też `npm run build`)
4. Potem uruchomi `npm start` (serwer Express serwuje zbudowane pliki)
5. **Settings → Domains** → wygeneruj publiczny URL
6. Gotowe — QR kod automatycznie wskazuje na właściwy adres

## Deploy na Render

- Build Command: `npm install`
- Start Command: `npm start`
- `postinstall` w package.json automatycznie buduje Vue

## Jak to działa

```
[Telefon /controller] ──touch──▶ socket.emit('control', { action })
                                          │
                                   [server.js relay]
                                          │
                               socket.emit('control', data)
                                          ▼
                              [GameView.vue /]
                          moveLeft / moveRight / rotate…
```

## Rozbudowa — przykłady

Dodanie nowego ekranu (np. menu): nowy plik w `src/views/` + wpis w `src/router/index.js`.
Zmiana logiki gry: tylko `src/composables/useTetris.js` — reszta bez zmian.
Nowy przycisk na kontrolerze: dodaj w `ControllerView.vue` i obsłuż w `GameView.vue`.
