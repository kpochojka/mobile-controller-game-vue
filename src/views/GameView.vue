<template>
  <div class="game-screen">

    <!-- LEWA KOLUMNA: QR + licznik kontrolerów -->
    <QRCodeDisplay :controller-count="controllerCount" />

    <!-- ŚRODEK: Gra -->
    <div class="game-area">
      <div class="title">TETRIS</div>
      <TetrisBoard :get-board-state="getBoardState" />
    </div>

    <!-- PRAWA KOLUMNA: Wyniki -->
    <ScorePanel
      :score="score"
      :level="level"
      :lines="lines"
      :next-type="nextType"
    />

    <!-- GAME OVER overlay -->
    <GameOverlay :show="gameOver" :score="score" />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TetrisBoard    from '../components/TetrisBoard.vue'
import ScorePanel     from '../components/ScorePanel.vue'
import QRCodeDisplay  from '../components/QRCodeDisplay.vue'
import GameOverlay    from '../components/GameOverlay.vue'
import { useTetris }  from '../composables/useTetris.js'
import socket         from '../socket.js'

const {
  score, level, lines, gameOver, nextType,
  moveLeft, moveRight, softDrop, doRotate, hardDrop,
  initGame, getBoardState
} = useTetris()

const controllerCount = ref(0)

// ── Socket.io ────────────────────────────────────────
socket.emit('register-display')

socket.on('display-ready', ({ controllers }) => {
  controllerCount.value = controllers
})

socket.on('controller-update', ({ count }) => {
  controllerCount.value = count
})

socket.on('control', ({ action }) => {
  if (gameOver.value) {
    if (action === 'start') initGame()
    return
  }
  if (action === 'left')   moveLeft()
  if (action === 'right')  moveRight()
  if (action === 'down')   softDrop()
  if (action === 'rotate') doRotate()
  if (action === 'drop')   hardDrop()
})

// ── Klawiatura (fallback dla testów) ─────────────────
function onKey(e) {
  if (gameOver.value) {
    if (e.code === 'Space' || e.code === 'Enter') initGame()
    return
  }
  if (e.code === 'ArrowLeft')  { e.preventDefault(); moveLeft()  }
  if (e.code === 'ArrowRight') { e.preventDefault(); moveRight() }
  if (e.code === 'ArrowDown')  { e.preventDefault(); softDrop()  }
  if (e.code === 'ArrowUp')    { e.preventDefault(); doRotate()  }
  if (e.code === 'Space')      { e.preventDefault(); hardDrop()  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  initGame()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  socket.off('display-ready')
  socket.off('controller-update')
  socket.off('control')
})
</script>

<style scoped>
.game-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  gap: 36px;
  padding: 20px;
}

.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 6px;
  color: #00d4ff;
  text-shadow: 0 0 18px rgba(0,212,255,0.5);
}
</style>
