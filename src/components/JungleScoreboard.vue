<template>
  <div class="scoreboard">
    <h2 class="title">Live ranking</h2>
    <div
      v-for="(player, idx) in sorted"
      :key="player.id"
      class="row"
      :class="{ leader: idx === 0 }"
    >
      <span class="rank">{{ idx + 1 }}</span>
      <span class="bird">{{ player.bird.emoji }}</span>
      <span class="name">{{ player.name }}</span>
      <span class="score">{{ player.score }}</span>
    </div>
    <div v-if="!players.length" class="empty">Waiting for birds to land…</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  players: { type: Array, required: true }
})

const sorted = computed(() =>
  [...props.players].sort((a, b) => b.score - a.score)
)
</script>

<style scoped>
.scoreboard {
  font-family: 'Outfit', system-ui, sans-serif;
  background: linear-gradient(
    160deg,
    rgba(12, 38, 26, 0.92) 0%,
    rgba(6, 22, 14, 0.88) 100%
  );
  border-radius: 18px;
  padding: 18px 18px 16px;
  min-width: 220px;
  color: #e8f5e9;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(100, 200, 140, 0.2);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(160, 220, 170, 0.75);
  margin: 0 0 6px;
  text-align: center;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.row.leader {
  background: linear-gradient(
    90deg,
    rgba(40, 120, 70, 0.45),
    rgba(20, 60, 40, 0.35)
  );
  border-color: rgba(120, 220, 150, 0.45);
  box-shadow: 0 0 20px rgba(80, 200, 120, 0.12);
}

.rank {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  width: 18px;
  text-align: center;
}

.bird {
  font-size: 26px;
  line-height: 1;
}

.name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.score {
  font-size: 17px;
  font-weight: 800;
  color: #fde68a;
  min-width: 2ch;
  text-align: right;
}

.empty {
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  text-align: center;
  padding: 16px 8px;
  font-weight: 500;
}
</style>
