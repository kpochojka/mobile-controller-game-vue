<template>
  <Transition name="fade">
    <div v-if="show" class="overlay">
      <div class="card">
        <h1 class="heading">🌴 Time's Up! 🌴</h1>
        <div class="podium">
          <div
            v-for="(entry, idx) in ranking"
            :key="entry.id ?? idx"
            class="entry"
            :class="{ top3: idx < 3 }"
          >
            <span class="medal">{{ medalFor(idx) }}</span>
            <span class="bird">{{ entry.bird.emoji }}</span>
            <span class="name">{{ entry.name }}</span>
            <span class="dash">—</span>
            <span class="pts">{{ entry.score }} pts</span>
          </div>
          <div v-if="!ranking.length" class="empty">No players this round.</div>
        </div>
        <p class="hint">Scan the QR code to play again</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show:    { type: Boolean, required: true },
  ranking: { type: Array,   required: true }
})

const MEDALS = ['🥇', '🥈', '🥉']
function medalFor(idx) {
  return MEDALS[idx] ?? String(idx + 1) + '.'
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.card {
  background: #0d2e0d;
  border: 2px solid #2d6e2d;
  border-radius: 20px;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 500px;
  width: 90%;
}

.heading {
  font-size: 36px;
  font-weight: 900;
  color: #7eff7e;
  margin: 0;
  text-align: center;
}

.podium {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  color: #ccc;
  font-size: 15px;
}

.entry.top3 {
  background: rgba(45, 110, 45, 0.35);
  color: #fff;
  font-size: 16px;
}

.medal { font-size: 20px; width: 28px; text-align: center; }
.bird  { font-size: 22px; }
.name  { flex: 1; font-weight: 600; }
.dash  { color: #555; }
.pts   { font-weight: 700; color: #ffff00; }

.hint {
  color: #666;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

.empty { color: #666; text-align: center; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>
