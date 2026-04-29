<template>
  <div class="jungle-shell">
    <div class="jungle-noise" aria-hidden="true" />

    <div class="jungle-page">
      <aside class="sidebar-left">
        <header class="brand-block">
          <h1 class="brand-title">Jungle Birds</h1>
          <p class="brand-sub">Phone squad · shared screen</p>
          <ul class="rules-blurb" aria-label="Game rules">
            <li><strong>Goal:</strong> Most points when time runs out (60s).</li>
            <li><strong>Collect</strong> fruit by flying over it.</li>
            <li><strong>Sloth &amp; monkeys</strong> steal fruit and block you; <strong>monkeys reset your score to 0</strong> on contact (not the sloth).</li>
          </ul>
        </header>
        <QRCodeDisplay
          :url="controllerUrl"
          :controllerCount="playerList.length"
        />
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

    </div>

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
.jungle-shell {
  position: relative;
  box-sizing: border-box;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: safe center;
  padding: clamp(12px, 2vw, 28px) clamp(10px, 2vw, 24px);
  font-family: 'Outfit', system-ui, sans-serif;
  background:
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(80, 180, 130, 0.22), transparent 55%),
    radial-gradient(ellipse 90% 60% at 100% 50%, rgba(30, 90, 60, 0.35), transparent 50%),
    radial-gradient(ellipse 80% 50% at 0% 80%, rgba(20, 60, 45, 0.4), transparent 45%),
    linear-gradient(165deg, #06120c 0%, #0a1f16 35%, #061008 100%);
  color: #e8f5e9;
  overflow-x: hidden;
}

.jungle-page {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
  align-items: start;
  gap: clamp(10px, 1.5vw, 24px);
  width: min(1680px, 100%);
  margin-inline: auto;
}

.jungle-noise {
  pointer-events: none;
  position: fixed;
  inset: 0;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  z-index: 0;
}

.sidebar-left,
.sidebar-right {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 232px;
  padding-top: 0;
}

.sidebar-left .brand-block {
  max-width: 100%;
}

.brand-block {
  text-align: center;
  margin-bottom: clamp(12px, 2vw, 20px);
  max-width: 220px;
}

.brand-title {
  margin: 0 0 6px;
  font-size: clamp(1.25rem, 3vw, 1.65rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(120deg, #c8f5c8 0%, #7fd99a 45%, #4ade80 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.brand-sub {
  margin: 0;
  font-size: clamp(0.65rem, 1.6vw, 0.8rem);
  font-weight: 600;
  color: rgba(180, 220, 190, 0.55);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rules-blurb {
  margin: 14px 0 0;
  padding: 0 0 0 1.1em;
  text-align: left;
  font-size: clamp(0.68rem, 1.5vw, 0.78rem);
  line-height: 1.45;
  color: rgba(190, 230, 200, 0.72);
  font-weight: 500;
  max-width: 220px;
  list-style: disc;
}

.rules-blurb li {
  margin-bottom: 0.35em;
}

.rules-blurb li:last-child {
  margin-bottom: 0;
}

.rules-blurb strong {
  color: rgba(220, 248, 220, 0.9);
  font-weight: 700;
}

.canvas-area {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
}

@media (max-width: 980px) {
  .jungle-shell {
    justify-content: flex-start;
    padding-block: clamp(16px, 3vw, 32px);
  }

  .jungle-page {
    grid-template-columns: 1fr;
    gap: clamp(14px, 4vw, 22px);
  }

  .sidebar-left,
  .sidebar-right {
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: clamp(14px, 4vw, 24px);
    max-width: 100%;
    width: 100%;
  }

  .sidebar-left {
    justify-content: center;
  }

  .sidebar-right {
    justify-content: center;
  }

  .canvas-area {
    order: -1;
  }

  .brand-block {
    margin-bottom: 0;
    flex-shrink: 0;
  }
}
</style>
