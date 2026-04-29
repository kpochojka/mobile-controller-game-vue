<template>
  <div class="canvas-scale-root">
    <div class="canvas-frame">
      <canvas
        ref="canvasEl"
        :width="CANVAS_W"
        :height="CANVAS_H"
        class="jungle-canvas"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  JUNGLE_CANVAS_W as CANVAS_W,
  JUNGLE_CANVAS_H as CANVAS_H,
  JUNGLE_BIRD_SIZE as BIRD_SIZE,
  JUNGLE_FOOD_SIZE as FOOD_SIZE,
  JUNGLE_SLOTH_SIZE as SLOTH_SIZE,
  JUNGLE_MONKEY_SIZE as MONKEY_SIZE
} from '../constants/jungleGame.js'

const props = defineProps({
  getBoardState: { type: Function, required: true },
  timeLeft:      { type: Number,   required: true },
  gameActive:    { type: Boolean,  required: true }
})

const canvasEl = ref(null)
let rafId = null
let startTime = 0

/** Precomputed firefly base positions (stable per session). */
const FIREFLIES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 97 + 23) % CANVAS_W,
  y: (i * 61 + 41) % (CANVAS_H - 120) + 40,
  phase: i * 0.7,
  size: 1.2 + (i % 4) * 0.35
}))

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function drawSkyAndAtmosphere(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55)
  sky.addColorStop(0, '#0c1a2e')
  sky.addColorStop(0.35, '#143d32')
  sky.addColorStop(0.7, '#1a4d2e')
  sky.addColorStop(1, '#0f2818')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const mist = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.92)
  mist.addColorStop(0, 'rgba(120, 200, 180, 0)')
  mist.addColorStop(0.5, 'rgba(80, 160, 130, 0.12)')
  mist.addColorStop(1, 'rgba(20, 50, 40, 0.35)')
  ctx.fillStyle = mist
  ctx.fillRect(0, 0, w, h)

  // Warm light through canopy
  const glow = ctx.createRadialGradient(w * 0.35, h * 0.08, 0, w * 0.35, h * 0.08, h * 0.75)
  glow.addColorStop(0, 'rgba(255, 220, 150, 0.18)')
  glow.addColorStop(0.4, 'rgba(255, 200, 120, 0.06)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
}

function drawDistantHills(ctx, w, h, t) {
  const sway = Math.sin(t * 0.4) * 4
  ctx.save()
  ctx.translate(sway * 0.15, 0)

  ctx.fillStyle = '#0d2420'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.42)
  ctx.bezierCurveTo(w * 0.2, h * 0.32 + sway, w * 0.45, h * 0.38, w * 0.65, h * 0.33)
  ctx.bezierCurveTo(w * 0.85, h * 0.28, w, h * 0.4, w, h * 0.55)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#102a24'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.48)
  ctx.bezierCurveTo(w * 0.25, h * 0.4, w * 0.5, h * 0.45, w * 0.75, h * 0.4)
  ctx.bezierCurveTo(w * 0.92, h * 0.36, w, h * 0.48, w, h * 0.58)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawTreeSilhouette(ctx, x, w, h, scale) {
  ctx.save()
  ctx.translate(x, h * 0.55)
  ctx.scale(scale, scale)
  // Trunk
  ctx.fillStyle = '#1a1008'
  ctx.beginPath()
  ctx.moveTo(-12, 0)
  ctx.quadraticCurveTo(-8, -h * 0.25, -4, -h * 0.42)
  ctx.lineTo(6, -h * 0.4)
  ctx.quadraticCurveTo(10, -h * 0.2, 14, 0)
  ctx.closePath()
  ctx.fill()
  // Canopy blobs
  const greens = ['#0d3d28', '#124b32', '#0f3525']
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = greens[i % greens.length]
    ctx.beginPath()
    ctx.ellipse(-20 + i * 18, -h * 0.48 - i * 6, 35 - i * 3, 22, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawVinesAndFoliage(ctx, w, h, t) {
  ctx.strokeStyle = 'rgba(15, 45, 28, 0.85)'
  ctx.lineWidth = 3
  for (let i = 0; i < 6; i++) {
    const x0 = 40 + i * (w / 5.5)
    const sway = Math.sin(t * 0.8 + i) * 12
    ctx.beginPath()
    ctx.moveTo(x0 + sway, 0)
    ctx.bezierCurveTo(x0 + sway * 1.5, h * 0.25, x0 - sway, h * 0.55, x0 + sway * 0.5, h * 0.85)
    ctx.stroke()
  }

  const patches = [
    { xf: 0.076, yf: 0.153, rxf: 0.053, ryf: 0.058, c: '#1d5c3a' },
    { xf: 0.283, yf: 0.089, rxf: 0.041, ryf: 0.045, c: '#226644' },
    { xf: 0.586, yf: 0.142, rxf: 0.056, ryf: 0.052, c: '#1a5035' },
    { xf: 0.870, yf: 0.100, rxf: 0.045, ryf: 0.048, c: '#1f5a3d' },
    { xf: 0.049, yf: 0.806, rxf: 0.048, ryf: 0.055, c: '#163d2a' },
    { xf: 0.337, yf: 0.903, rxf: 0.061, ryf: 0.058, c: '#1a4d35' },
    { xf: 0.717, yf: 0.887, rxf: 0.050, ryf: 0.052, c: '#174430' },
    { xf: 0.957, yf: 0.806, rxf: 0.052, ryf: 0.048, c: '#143d2a' },
    { xf: 0.488, yf: 0.194, rxf: 0.070, ryf: 0.065, c: 'rgba(30, 90, 55, 0.45)' }
  ]
  for (const p of patches) {
    const px = p.xf * w
    const py = p.yf * h
    const prx = p.rxf * w
    const pry = p.ryf * h
    ctx.fillStyle = p.c
    ctx.beginPath()
    ctx.ellipse(px, py, prx, pry, Math.sin(t * 0.3 + px * 0.01) * 0.08, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawGround(ctx, w, h) {
  const g = ctx.createLinearGradient(0, h * 0.78, 0, h)
  g.addColorStop(0, 'rgba(12, 35, 22, 0)')
  g.addColorStop(0.3, 'rgba(8, 28, 16, 0.55)')
  g.addColorStop(1, 'rgba(4, 18, 10, 0.92)')
  ctx.fillStyle = g
  ctx.fillRect(0, h * 0.72, w, h * 0.28)

  ctx.fillStyle = 'rgba(5, 20, 12, 0.4)'
  ctx.fillRect(0, h * 0.88, w, h * 0.12)
}

function drawFireflies(ctx, t) {
  for (const f of FIREFLIES) {
    const pulse = 0.4 + Math.sin(t * 2 + f.phase) * 0.35
    const gx = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 8)
    gx.addColorStop(0, `rgba(200, 255, 170, ${pulse * 0.55})`)
    gx.addColorStop(0.5, `rgba(150, 220, 120, ${pulse * 0.18})`)
    gx.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gx
    ctx.beginPath()
    ctx.arc(f.x + Math.sin(t + f.phase) * 6, f.y + Math.cos(t * 1.3 + f.phase) * 4, f.size * 6, 0, Math.PI * 2)
    ctx.fill()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawSloth(ctx, sloth) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${SLOTH_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  ctx.shadowColor = 'rgba(0, 25, 15, 0.65)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 5
  ctx.fillText('🦥', sloth.x, sloth.y)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.font = '700 11px Outfit, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(230, 245, 235, 0.92)'
  ctx.fillText('Hungry sloth', sloth.x, sloth.y + SLOTH_SIZE * 0.42)
  ctx.restore()
}

function drawMonkeys(ctx, monkeys) {
  if (!monkeys?.length) return
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${MONKEY_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  for (const m of monkeys) {
    ctx.save()
    ctx.shadowColor = 'rgba(0, 20, 10, 0.5)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 4
    ctx.fillText('🐒', m.x, m.y)
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    ctx.font = '700 10px Outfit, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(254, 249, 231, 0.95)'
    ctx.fillText(m.label, m.x, m.y + MONKEY_SIZE * 0.42)
    ctx.restore()
  }
}

function drawBirdLabel(ctx, cx, cy, name, score) {
  ctx.font = '600 13px Outfit, system-ui, sans-serif'
  const nameStr = String(name || '?')
  const scoreStr = String(score)
  const twName = ctx.measureText(nameStr).width
  ctx.font = '700 12px Outfit, system-ui, sans-serif'
  const twScore = ctx.measureText(scoreStr).width
  const padX = 10
  const padY = 5
  const gap = 2
  const w = Math.max(twName, twScore) + padX * 2
  const hName = 16
  const hScore = 14
  const boxH = hName + hScore + padY * 2 + gap
  const top = cy + BIRD_SIZE * 0.42

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  ctx.fillStyle = 'rgba(8, 28, 18, 0.82)'
  roundRect(ctx, cx - w / 2, top, w, boxH, 10)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#e8f5e9'
  ctx.font = '600 13px Outfit, system-ui, sans-serif'
  ctx.fillText(nameStr, cx, top + padY + hName / 2)
  ctx.fillStyle = '#ffe082'
  ctx.font = '700 12px Outfit, system-ui, sans-serif'
  ctx.fillText(scoreStr, cx, top + padY + hName + gap + hScore / 2)
  ctx.restore()
}

function draw() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = CANVAS_W
  const h = CANVAS_H
  const t = (performance.now() - startTime) / 1000

  const { players, foods, sloth, monkeys } = props.getBoardState()

  drawSkyAndAtmosphere(ctx, w, h)
  drawDistantHills(ctx, w, h, t)
  drawTreeSilhouette(ctx, -20, w, h, 1.15)
  drawTreeSilhouette(ctx, w - 110, w, h, 1.05)
  drawVinesAndFoliage(ctx, w, h, t)
  drawGround(ctx, w, h)
  drawFireflies(ctx, t)

  // Collectibles — larger emoji with soft glow
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${FOOD_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  for (const food of foods) {
    ctx.save()
    ctx.shadowColor = 'rgba(255, 240, 180, 0.45)'
    ctx.shadowBlur = 14
    ctx.fillText(food.emoji, food.x, food.y)
    ctx.restore()
  }

  if (sloth) drawSloth(ctx, sloth)
  drawMonkeys(ctx, monkeys)

  // Birds
  ctx.font = `${BIRD_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  for (const player of players.values()) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 4
    ctx.fillText(player.bird.emoji, player.x, player.y)
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    drawBirdLabel(ctx, player.x, player.y, player.name, player.score)
    ctx.restore()
  }

  // Timer chip
  const timeStr = formatTime(props.timeLeft)
  ctx.font = '600 10px Outfit, system-ui, sans-serif'
  const twLab = ctx.measureText('TIME LEFT').width
  ctx.font = '700 21px Outfit, system-ui, sans-serif'
  const twTime = ctx.measureText(timeStr).width
  const chipW = Math.max(142, Math.max(twLab, twTime) + 40)
  const chipH = 50
  const chipX = w - 20 - chipW
  const chipY = 18

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 16
  ctx.fillStyle = 'rgba(6, 22, 14, 0.88)'
  roundRect(ctx, chipX, chipY, chipW, chipH, 12)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(180, 220, 190, 0.8)'
  ctx.font = '600 10px Outfit, system-ui, sans-serif'
  ctx.fillText('TIME LEFT', chipX + chipW / 2, chipY + 16)
  ctx.fillStyle = '#fff8e1'
  ctx.font = '700 21px Outfit, system-ui, sans-serif'
  ctx.fillText(timeStr, chipX + chipW / 2, chipY + 35)
  ctx.restore()

  rafId = requestAnimationFrame(draw)
}

onMounted(() => {
  startTime = performance.now()
  rafId = requestAnimationFrame(draw)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/**
 * Fits the viewport: intrinsic buffer stays 1280×740 while CSS scales the drawable region.
 */
.canvas-scale-root {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  aspect-ratio: 1280 / 740;
  min-height: 0;
}

.canvas-frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 20px;
  padding: 3px;
  box-sizing: border-box;
  background: linear-gradient(
    145deg,
    rgba(80, 160, 110, 0.45) 0%,
    rgba(20, 60, 40, 0.9) 40%,
    rgba(10, 35, 22, 0.95) 100%
  );
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(120, 200, 150, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.jungle-canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 17px;
  vertical-align: middle;
}
</style>
