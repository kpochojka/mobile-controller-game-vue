<template>
  <div class="panel-group">
    <div class="panel">
      <h3>Score</h3>
      <div class="value">{{ score.toLocaleString() }}</div>
    </div>
    <div class="panel">
      <h3>Level</h3>
      <div class="value">{{ level }}</div>
    </div>
    <div class="panel">
      <h3>Lines</h3>
      <div class="value">{{ lines }}</div>
    </div>
    <div class="panel">
      <h3>Next</h3>
      <NextPiece :next-type="nextType" />
    </div>
  </div>
</template>

<script setup>
import NextPiece from './NextPiece.vue'

defineProps({
  score:    { type: Number, required: true },
  level:    { type: Number, required: true },
  lines:    { type: Number, required: true },
  nextType: { type: String, required: true }
})
</script>

<style scoped>
.panel-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 150px;
}

.panel {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 14px 18px;
}

.panel h3 {
  font-size: 10px;
  letter-spacing: 2px;
  color: #555;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.value {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
}
</style>
