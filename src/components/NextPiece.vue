<template>
  <canvas ref="canvasRef" width="100" height="100" />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { COLORS } from '../composables/useTetris.js'

const props = defineProps({
  nextType: { type: String, required: true }
})

const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]]
}

const canvasRef = ref(null)
const BSIZE = 22

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx   = canvas.getContext('2d')
  const shape = SHAPES[props.nextType]
  const color = COLORS[props.nextType]

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const offsetX = Math.floor((canvas.width  - shape[0].length * BSIZE) / 2)
  const offsetY = Math.floor((canvas.height - shape.length    * BSIZE) / 2)

  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const x = offsetX + c * BSIZE
        const y = offsetY + r * BSIZE
        ctx.fillStyle = color
        ctx.fillRect(x + 1, y + 1, BSIZE - 2, BSIZE - 2)
        ctx.fillStyle = 'rgba(255,255,255,0.22)'
        ctx.fillRect(x + 1, y + 1, BSIZE - 2, 4)
        ctx.fillRect(x + 1, y + 1, 4, BSIZE - 2)
      }
}

onMounted(draw)
watch(() => props.nextType, draw)
</script>
