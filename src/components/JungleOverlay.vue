<template>
  <Transition name="fade">
    <div v-if="show" class="overlay">
      <div class="glow-ring" aria-hidden="true" />
      <div class="card">
        <h1 class="heading">
          Time’s up!
        </h1>
        <p class="sub">Jungle leaderboard</p>
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
            <span class="pts">{{ entry.score }}</span>
            <span class="pts-label">pts</span>
          </div>
          <div v-if="!ranking.length" class="empty">No players this round.</div>
        </div>
        <p class="hint">Reload the display or scan the QR to play again.</p>
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
  return MEDALS[idx] ?? String(idx + 1)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 8, 5, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-family: 'Outfit', system-ui, sans-serif;
}

.glow-ring {
  position: absolute;
  width: min(90vw, 560px);
  height: min(90vh, 520px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(60, 180, 110, 0.12) 0%,
    transparent 65%
  );
  pointer-events: none;
}

.card {
  position: relative;
  background: linear-gradient(
    165deg,
    rgba(14, 48, 32, 0.98) 0%,
    rgba(6, 22, 14, 0.98) 100%
  );
  border: 1px solid rgba(120, 200, 150, 0.28);
  border-radius: 24px;
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 18px;
  max-width: 480px;
  width: 90%;
  box-shadow:
    0 28px 64px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.heading {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
  text-align: center;
  background: linear-gradient(115deg, #ecfccb 0%, #86efac 50%, #4ade80 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sub {
  margin: -8px 0 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(170, 220, 180, 0.55);
}

.podium {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.entry {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(230, 245, 230, 0.88);
  font-size: 15px;
}

.entry.top3 {
  background: linear-gradient(
    90deg,
    rgba(34, 100, 64, 0.45),
    rgba(14, 40, 28, 0.4)
  );
  border-color: rgba(100, 200, 130, 0.25);
  color: #fff;
}

.medal {
  font-size: 22px;
  width: 32px;
  text-align: center;
}

.bird {
  font-size: 26px;
  line-height: 1;
}

.name {
  font-weight: 600;
  letter-spacing: -0.02em;
}

.pts {
  font-weight: 800;
  color: #fde68a;
  font-variant-numeric: tabular-nums;
}

.pts-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
}

.hint {
  color: rgba(180, 210, 180, 0.5);
  font-size: 13px;
  margin: 8px 0 0;
  text-align: center;
  font-weight: 500;
}

.empty {
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.45s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
