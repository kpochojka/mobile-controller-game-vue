<template>
  <div class="jungle-page">
    <aside class="sidebar-left">
      <QRCodeDisplay :url="controllerUrl" :controllerCount="playerList.length" />
    </aside>

    <main class="canvas-area">
      <JungleCanvas
        :getBoardState="getBoardState"
        :timeLeft="timeLeft"
        :gameActive="gameActive"
      />
    </main>

    <aside class="sidebar-right">
      <JungleScoreboard :players="playerList" />
    </aside>

    <JungleOverlay :show="gameEnded" :ranking="finalRanking" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import socket from '../socket.js'
import { useJungle } from '../composables/useJungle.js'
import QRCodeDisplay from '../components/QRCodeDisplay.vue'
import JungleCanvas from '../components/JungleCanvas.vue'
import JungleScoreboard from '../components/JungleScoreboard.vue'
import JungleOverlay from '../components/JungleOverlay.vue'

const {
  timeLeft, gameActive, gameEnded, playerList,
  initGame, addPlayer, removePlayer, applyControl, applyScoreUpdate,
  getBoardState, cleanup
} = useJungle()

const finalRanking = ref([])

const controllerUrl = computed(() => window.location.origin + '/jungle-controller')

onMounted(() => {
  socket.emit('register-jungle-display')

  socket.on('jungle-display-ready', ({ players }) => {
    initGame()
    for (const p of players) addPlayer(p)
  })

  socket.on('jungle-player-joined', ({ players }) => {
    for (const p of players) addPlayer(p)
  })

  socket.on('jungle-player-left', ({ players }) => {
    const incoming = new Set(players.map(p => p.id))
    for (const p of playerList.value) {
      if (!incoming.has(p.id)) removePlayer(p.id)
    }
    for (const p of players) addPlayer(p)
  })

  socket.on('jungle-control', ({ playerId, action }) => {
    applyControl(playerId, action)
  })

  socket.on('jungle-score-update', ({ playerId, score }) => {
    applyScoreUpdate(playerId, score)
  })

  socket.on('jungle-final-ranking', ({ ranking }) => {
    finalRanking.value = ranking
  })
})

onUnmounted(() => {
  cleanup()
  socket.off('jungle-display-ready')
  socket.off('jungle-player-joined')
  socket.off('jungle-player-left')
  socket.off('jungle-control')
  socket.off('jungle-score-update')
  socket.off('jungle-final-ranking')
})
</script>

<style scoped>
.jungle-page {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.sidebar-left,
.sidebar-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.canvas-area {
  flex-shrink: 0;
}
</style>
