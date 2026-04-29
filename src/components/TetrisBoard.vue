<template>
  <canvas ref="canvasRef" :width="COLS * BLOCK" :height="ROWS * BLOCK" class="board" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { COLS, ROWS, BLOCK, COLORS } from '../composables/useTetris.js'

const props = defineProps({
  getBoardState: { type: Function, required: true }
})

const canvasRef = ref(null)
let animId = null

// ── Rysowanie jednego bloku ──────────────────────────
function drawBlock(ctx, x, y, color, alpha = 1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle   = color
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2)
  // Highlight (górna i lewa krawędź)
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 5)
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, 5, BLOCK - 2)
  // Cień (dolna i prawa krawędź)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + BLOCK - 6, BLOCK - 2, 5)
  ctx.fillRect(x * BLOCK + BLOCK - 6, y * BLOCK + 1, 5, BLOCK - 2)
  ctx.globalAlpha = 1
}

// ── Główna pętla rysowania (requestAnimationFrame) ───
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const { board, currentPiece, ghostY } = props.getBoardState()

  // Tło
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Siatka
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth   = 1
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK)

  // Zablokowane bloki na planszy
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c])
        drawBlock(ctx, c, r, COLORS[board[r][c]])

  // Aktywny klocek + duch
  if (currentPiece) {
    const { shape, x, y, type } = currentPiece
    const color = COLORS[type]

    // Duch (ghost)
    if (ghostY !== null && ghostY !== y) {
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c])
            drawBlock(ctx, x + c, ghostY + r, color, 0.18)
    }

    // Aktualny klocek
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c])
          drawBlock(ctx, x + c, y + r, color)
  }
}

function loop() {
  draw()
  animId = requestAnimationFrame(loop)
}

onMounted(() => { animId = requestAnimationFrame(loop) })
onUnmounted(() => cancelAnimationFrame(animId))
</script>

<style scoped>
.board {
  display: block;
  border: 2px solid rgba(0, 212, 255, 0.35);
  border-radius: 4px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.12);
}
</style>
