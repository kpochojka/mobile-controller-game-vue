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

  socket.on('disconnect', () => {
    if (displaySocket?.id === socket.id) displaySocket = null
    if (controllerSockets.delete(socket.id) && displaySocket) {
      displaySocket.emit('controller-update', { count: controllerSockets.size })
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
