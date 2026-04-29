<template>
  <div class="scoreboard">
    <h2 class="title">🌿 Scores</h2>
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
    <div v-if="!players.length" class="empty">Waiting for players…</div>
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
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 16px 20px;
  min-width: 180px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #7eff7e;
  margin: 0 0 8px;
  text-align: center;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(255,255,255,0.08);
}

.row.leader {
  background: rgba(45, 110, 45, 0.5);
  border-color: #7eff7e;
}

.rank  { font-size: 12px; color: #888; width: 16px; text-align: center; }
.bird  { font-size: 20px; }
.name  { flex: 1; font-size: 13px; }
.score { font-size: 16px; font-weight: 700; color: #ffff00; }

.empty { color: #666; font-size: 13px; text-align: center; padding: 8px 0; }
</style>
