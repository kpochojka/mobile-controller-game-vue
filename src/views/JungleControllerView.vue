<template>
  <div class="ctrl-page">
    <!-- Status bar -->
    <div class="status-bar">
      <span class="dot" :class="connected ? 'connected' : 'disconnected'" />
      <span class="status-text">{{ connected ? 'Connected' : 'Connecting…' }}</span>
    </div>

    <!-- Bird info -->
    <div v-if="connected && !gameOver" class="bird-section">
      <div class="bird-emoji">{{ bird?.emoji }}</div>
      <div class="bird-name">{{ bird?.name }}</div>
      <div class="score-display">Score: <strong>{{ score }}</strong></div>
    </div>

    <!-- D-pad -->
    <div v-if="connected && !gameOver" class="dpad">
      <div class="dpad-grid">
        <div />
        <button
          class="dpad-btn"
          @touchstart.prevent="press('up')"
          @touchend.prevent="release('up')"
        >▲</button>
        <div />
        <button
          class="dpad-btn"
          @touchstart.prevent="press('left')"
          @touchend.prevent="release('left')"
        >◀</button>
        <div />
        <button
          class="dpad-btn"
          @touchstart.prevent="press('right')"
          @touchend.prevent="release('right')"
        >▶</button>
        <div />
        <button
          class="dpad-btn"
          @touchstart.prevent="press('down')"
          @touchend.prevent="release('down')"
        >▼</button>
        <div />
      </div>
    </div>

    <!-- Game over -->
    <div v-if="gameOver" class="gameover">
      <div class="go-heading">🌴 Game Over!</div>
      <div class="go-score">Final score: <strong>{{ score }}</strong></div>
      <div class="go-hint">Scan the QR code on screen to play again</div>
    </div>

    <!-- Waiting screen (not yet connected) -->
    <div v-if="!connected" class="waiting">
      <div class="wait-text">Joining the jungle…</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import socket from '../socket.js'

const connected = ref(false)
const gameOver  = ref(false)
const myId      = ref(null)
const bird      = ref(null)
const score     = ref(0)

function press(dir) {
  socket.emit('jungle-control', { action: dir })
}

function release(dir) {
  const axis = (dir === 'left' || dir === 'right') ? 'stop-x' : 'stop-y'
  socket.emit('jungle-control', { action: axis })
}

onMounted(() => {
  socket.emit('register-jungle-player')

  socket.on('jungle-player-ready', ({ id, bird: b, name }) => {
    myId.value = id
    bird.value = b
    connected.value = true
  })

  socket.on('jungle-score-update', ({ playerId, score: s }) => {
    if (playerId === myId.value) score.value = s
  })

  socket.on('jungle-game-over', () => {
    gameOver.value = true
  })
})

onUnmounted(() => {
  socket.off('jungle-player-ready')
  socket.off('jungle-score-update')
  socket.off('jungle-game-over')
})
</script>

<style scoped>
.ctrl-page {
  min-height: 100vh;
  background: #0d2e0d;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 16px;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 10px 16px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.connected    { background: #4cff4c; }
.dot.disconnected { background: #ff4c4c; }

.status-text { font-size: 14px; color: #aaa; }

.bird-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.bird-emoji  { font-size: 64px; line-height: 1; }
.bird-name   { font-size: 22px; font-weight: 700; color: #7eff7e; }
.score-display { font-size: 18px; color: #ffff00; }

.dpad { margin-top: 24px; }

.dpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 80px);
  grid-template-rows: repeat(3, 80px);
  gap: 8px;
}

.dpad-btn {
  width: 80px;
  height: 80px;
  border-radius: 14px;
  background: #2d6e2d;
  color: #fff;
  font-size: 28px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.dpad-btn:active { background: #3e9e3e; }

.gameover {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
  text-align: center;
}

.go-heading { font-size: 32px; font-weight: 800; color: #7eff7e; }
.go-score   { font-size: 20px; color: #ffff00; }
.go-hint    { font-size: 14px; color: #888; margin-top: 8px; }

.waiting {
  margin-top: 60px;
  color: #555;
  font-size: 18px;
}
</style>
