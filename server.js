const express  = require('express')
const http     = require('http')
const { Server } = require('socket.io')
const path     = require('path')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server)

// Serwuje zbudowaną aplikację Vue z folderu dist/
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — Vue Router obsługuje /controller
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ── Socket.io ────────────────────────────────────────
let displaySocket = null
const controllerSockets = new Set()

// ── Jungle game state ─────────────────────────────────
let jungleDisplaySocket = null
const junglePlayers = new Map() // socket.id → { id, bird, score, name }

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
let birdIndex = 0

io.on('connection', (socket) => {
  socket.on('register-display', () => {
    displaySocket = socket
    socket.emit('display-ready', { controllers: controllerSockets.size })
  })

  socket.on('register-controller', () => {
    controllerSockets.add(socket.id)
    socket.emit('controller-ready')
    if (displaySocket) {
      displaySocket.emit('controller-update', { count: controllerSockets.size })
    }
  })

  // Przekazuje ruch z kontrolera → wyświetlacz
  socket.on('control', (data) => {
    if (displaySocket) displaySocket.emit('control', data)
  })

  // ── Jungle events ──────────────────────────────────
  socket.on('register-jungle-display', () => {
    jungleDisplaySocket = socket
    socket.emit('jungle-display-ready', { players: [...junglePlayers.values()] })
  })

  socket.on('register-jungle-player', () => {
    const bird = BIRD_POOL[birdIndex % BIRD_POOL.length]
    birdIndex++
    const player = { id: socket.id, bird, score: 0, name: bird.name }
    junglePlayers.set(socket.id, player)
    socket.emit('jungle-player-ready', { id: socket.id, bird, name: bird.name })
    if (jungleDisplaySocket) {
      jungleDisplaySocket.emit('jungle-player-joined', { players: [...junglePlayers.values()] })
    }
  })

  socket.on('jungle-control', ({ action }) => {
    if (jungleDisplaySocket) {
      jungleDisplaySocket.emit('jungle-control', { playerId: socket.id, action })
    }
  })

  socket.on('jungle-score-update', ({ playerId, score }) => {
    const player = junglePlayers.get(playerId)
    if (player) player.score = score
    if (jungleDisplaySocket) {
      jungleDisplaySocket.emit('jungle-score-update', { playerId, score })
    }
    const playerSocket = io.sockets.sockets.get(playerId)
    if (playerSocket) {
      playerSocket.emit('jungle-score-update', { playerId, score })
    }
  })

  socket.on('jungle-game-end', () => {
    const ranking = [...junglePlayers.values()]
      .sort((a, b) => b.score - a.score)
      .map(p => ({ id: p.id, name: p.name, bird: p.bird, score: p.score }))
    if (jungleDisplaySocket) {
      jungleDisplaySocket.emit('jungle-final-ranking', { ranking })
    }
    junglePlayers.forEach((_, id) => {
      const s = io.sockets.sockets.get(id)
      if (s) s.emit('jungle-game-over')
    })
  })

  socket.on('disconnect', () => {
    if (displaySocket?.id === socket.id) displaySocket = null
    if (controllerSockets.delete(socket.id) && displaySocket) {
      displaySocket.emit('controller-update', { count: controllerSockets.size })
    }
    if (jungleDisplaySocket?.id === socket.id) jungleDisplaySocket = null
    if (junglePlayers.has(socket.id)) {
      junglePlayers.delete(socket.id)
      if (jungleDisplaySocket) {
        jungleDisplaySocket.emit('jungle-player-left', { players: [...junglePlayers.values()] })
      }
    }
  })
})

const envPort = process.env.PORT
const strictPort =
  envPort !== undefined && String(envPort).trim() !== ''
const preferredPort = strictPort ? Number(envPort) : 3000

if (strictPort && (Number.isNaN(preferredPort) || preferredPort < 1 || preferredPort > 65535)) {
  console.error('Invalid PORT; use a number between 1 and 65535.')
  process.exit(1)
}

const portMax = strictPort ? preferredPort : preferredPort + 30

function start(port) {
  server.removeAllListeners('error')
  server.once('error', (err) => {
    if (err.code !== 'EADDRINUSE') throw err
    if (strictPort || port >= portMax) {
      console.error(
        strictPort
          ? `Port ${port} is already in use. Stop the other process or set a different PORT.`
          : `Could not bind (ports ${preferredPort}–${portMax} are busy). Free a port or set PORT.`
      )
      process.exit(1)
    }
    const next = port + 1
    console.warn(`Port ${port} in use, trying ${next}…`)
    start(next)
  })
  server.listen(port, () => {
    server.removeAllListeners('error')
    const actual = server.address().port
    console.log(`\n🎮  Tetris Vue — http://localhost:${actual}\n`)
    if (!strictPort && actual !== preferredPort) {
      console.warn(
        `Socket.io proxy (Vite): VITE_SOCKET_IO_TARGET=http://localhost:${actual} npm run dev:client\n`
      )
    }
  })
}

start(preferredPort)
