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

const JUNGLE_BG_URL =
  (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/') + 'design/background.png'

const props = defineProps({
  getBoardState: { type: Function, required: true },
  timeLeft:      { type: Number,   required: true },
  gameActive:    { type: Boolean,  required: true }
})

const canvasEl = ref(null)
/** Loaded once; drawn with cover fit to match canvas aspect ratio. */
const bgImage = ref(null)
let rafId = null

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Like CSS object-fit: cover — center-crop bitmap to cw×ch */
function drawImageCover(ctx, img, x, y, cw, ch) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return
  const ir = iw / ih
  const cr = cw / ch
  let sx
  let sy
  let sw
  let sh
  if (ir > cr) {
    sh = ih
    sw = ih * cr
    sx = (iw - sw) / 2
    sy = 0
  } else {
    sw = iw
    sh = iw / cr
    sx = 0
    sy = (ih - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, cw, ch)
}

function drawBackground(ctx, w, h) {
  const img = bgImage.value
  if (img && img.complete && img.naturalWidth) {
    drawImageCover(ctx, img, 0, 0, w, h)
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0c1a14')
    g.addColorStop(1, '#051008')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(200, 230, 210, 0.45)'
    ctx.font = '600 16px Outfit, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Loading jungle…', w / 2, h / 2)
  }

  const v = ctx.createRadialGradient(
    w * 0.5,
    h * 0.42,
    h * 0.15,
    w * 0.5,
    h * 0.5,
    h * 0.85
  )
  v.addColorStop(0, 'rgba(0, 0, 0, 0)')
  v.addColorStop(0.65, 'rgba(5, 22, 14, 0.12)')
  v.addColorStop(1, 'rgba(2, 14, 8, 0.35)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)

  const bottomFade = ctx.createLinearGradient(0, h * 0.55, 0, h)
  bottomFade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  bottomFade.addColorStop(1, 'rgba(0, 18, 10, 0.25)')
  ctx.fillStyle = bottomFade
  ctx.fillRect(0, 0, w, h)
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

  const { players, foods, sloth, monkeys } = props.getBoardState()

  drawBackground(ctx, w, h)

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
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    bgImage.value = img
  }
  img.onerror = () => {
    console.warn('[JungleCanvas] Background image failed to load:', JUNGLE_BG_URL)
  }
  img.src = JUNGLE_BG_URL
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
