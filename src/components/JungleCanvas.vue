<template>
  <canvas ref="canvasEl" :width="CANVAS_W" :height="CANVAS_H" class="jungle-canvas" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const CANVAS_W = 900
const CANVAS_H = 600

const LEAF_PATCHES = [
  { x: 80,  y: 90,  rx: 55, ry: 30 },
  { x: 250, y: 50,  rx: 40, ry: 20 },
  { x: 520, y: 80,  rx: 60, ry: 25 },
  { x: 780, y: 60,  rx: 45, ry: 22 },
  { x: 50,  y: 480, rx: 50, ry: 28 },
  { x: 300, y: 550, rx: 65, ry: 30 },
  { x: 650, y: 530, rx: 55, ry: 25 },
  { x: 860, y: 490, rx: 40, ry: 20 },
]

const props = defineProps({
  getBoardState: { type: Function, required: true },
  timeLeft:      { type: Number,   required: true },
  gameActive:    { type: Boolean,  required: true }
})

const canvasEl = ref(null)
let rafId = null

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function draw() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const { players, foods } = props.getBoardState()

  // Background
  ctx.fillStyle = '#1a4a1a'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Leaf patches
  ctx.fillStyle = '#2d6e2d'
  for (const p of LEAF_PATCHES) {
    ctx.beginPath()
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Food items
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '28px serif'
  for (const food of foods) {
    ctx.fillText(food.emoji, food.x, food.y)
  }

  // Birds
  for (const player of players.values()) {
    ctx.font = '36px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.fillText(player.bird.emoji, player.x, player.y)

    ctx.font = 'bold 12px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 4
    ctx.fillText(player.name, player.x, player.y + 26)

    ctx.fillStyle = '#ffff00'
    ctx.fillText(String(player.score), player.x, player.y + 40)
  }

  // HUD — timer
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 6
  ctx.font = 'bold 32px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(formatTime(props.timeLeft), CANVAS_W - 16, 16)

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  rafId = requestAnimationFrame(draw)
}

onMounted(() => {
  rafId = requestAnimationFrame(draw)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.jungle-canvas {
  display: block;
  border-radius: 8px;
}
</style>
