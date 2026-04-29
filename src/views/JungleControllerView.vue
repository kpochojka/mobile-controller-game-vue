<template>
  <div class="ctrl-page">
    <div class="ctrl-noise" aria-hidden="true" />

    <!-- Status bar -->
    <div class="status-bar">
      <span class="dot" :class="connected ? 'connected' : 'disconnected'" />
      <span class="status-text">{{ connected ? 'Connected' : 'Connecting…' }}</span>
    </div>

    <!-- Bird info -->
    <div v-if="connected && !gameOver" class="bird-section">
      <div class="bird-emoji">{{ bird?.emoji }}</div>
      <div class="bird-name">{{ bird?.name }}</div>
      <div class="score-display">Score <strong>{{ score }}</strong></div>
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
      <div class="go-heading">Round complete</div>
      <div class="go-score">Your score <strong>{{ score }}</strong></div>
      <div class="go-hint">Scan the QR on the main screen to play again</div>
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

  socket.on('jungle-player-ready', ({ id, bird: b }) => {
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
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(ellipse 100% 60% at 50% -10%, rgba(60, 160, 100, 0.2), transparent 55%),
    linear-gradient(180deg, #050f0c 0%, #0a1f17 45%, #050c09 100%);
  color: #e8f5e9;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  font-family: 'Outfit', system-ui, sans-serif;
}

.ctrl-noise {
  pointer-events: none;
  position: fixed;
  inset: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  z-index: 0;
}

.status-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  background: rgba(12, 40, 28, 0.55);
  border: 1px solid rgba(100, 200, 140, 0.15);
  border-radius: 14px;
  padding: 12px 18px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.connected    { background: #4ade80; box-shadow: 0 0 10px rgba(74, 222, 128, 0.6); }
.dot.disconnected { background: #f87171; }

.status-text { font-size: 14px; font-weight: 600; color: rgba(200, 220, 200, 0.75); }

.bird-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.bird-emoji {
  font-size: 92px;
  line-height: 1;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4));
}

.bird-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(120deg, #d9f99d 0%, #86efac 55%, #4ade80 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.score-display {
  font-size: 17px;
  font-weight: 600;
  color: rgba(220, 240, 220, 0.85);
}

.score-display strong {
  color: #fde68a;
  font-weight: 800;
}

.dpad {
  margin-top: 16px;
  position: relative;
  z-index: 1;
}

.dpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 86px);
  grid-template-rows: repeat(3, 86px);
  gap: 10px;
}

.dpad-btn {
  width: 86px;
  height: 86px;
  border-radius: 18px;
  background: linear-gradient(165deg, #166534 0%, #14532d 100%);
  color: #ecfdf5;
  font-size: 28px;
  border: 1px solid rgba(120, 200, 150, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.dpad-btn:active {
  background: linear-gradient(165deg, #15803d 0%, #166534 100%);
  transform: scale(0.97);
}

.gameover {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 48px;
  text-align: center;
  padding: 0 16px;
}

.go-heading {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(120deg, #ecfccb 0%, #86efac 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.go-score {
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(230, 245, 230, 0.9);
}

.go-score strong {
  color: #fde68a;
  font-weight: 800;
}

.go-hint {
  font-size: 14px;
  color: rgba(180, 200, 180, 0.55);
  margin-top: 4px;
  line-height: 1.5;
}

.waiting {
  position: relative;
  z-index: 1;
  margin-top: 60px;
  color: rgba(180, 200, 180, 0.5);
  font-size: 17px;
  font-weight: 600;
}
</style>
