<template>
  <Transition name="fade">
    <div v-if="show" class="overlay">
      <h2>GAME OVER</h2>
      <p>Wynik: <strong>{{ score.toLocaleString() }}</strong></p>
      <div class="hint">Naciśnij ▶/↺ na kontrolerze, aby zagrać ponownie</div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show:  { type: Boolean, required: true },
  score: { type: Number,  required: true }
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.72);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

h2 {
  font-size: 52px;
  font-weight: 900;
  color: #ff4466;
  text-shadow: 0 0 28px rgba(255,68,102,0.55);
  letter-spacing: 4px;
}

p {
  color: #ccc;
  font-size: 20px;
}

p strong {
  color: #fff;
}

.hint {
  margin-top: 8px;
  background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.3);
  border-radius: 10px;
  padding: 10px 22px;
  color: #00d4ff;
  font-size: 15px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
