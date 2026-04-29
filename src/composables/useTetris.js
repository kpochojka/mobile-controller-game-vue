import { ref, onUnmounted } from 'vue'

// ─── Stałe ────────────────────────────────────────────
export const COLS = 10
export const ROWS = 20
export const BLOCK = 30

export const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00e000',
  Z: '#f00000',
  J: '#0050f0',
  L: '#f0a000'
}

const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]]
}

const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 }
const PIECE_TYPES = Object.keys(SHAPES)

// ─── Composable ───────────────────────────────────────
export function useTetris() {
  // Stan reaktywny (dla templatów Vue)
  const score       = ref(0)
  const level       = ref(1)
  const lines       = ref(0)
  const gameOver    = ref(false)
  const nextType    = ref('T')

  // Stan wewnętrzny gry (używany przez canvas)
  let board         = []
  let currentPiece  = null
  let dropTimer     = null

  // ── Pomocniki ─────────────────────────────────────
  function randomType() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
  }

  function cloneShape(shape) {
    return shape.map(row => [...row])
  }

  function rotate(shape) {
    const rows = shape.length
    const cols = shape[0].length
    const result = Array.from({ length: cols }, () => Array(rows).fill(0))
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        result[c][rows - 1 - r] = shape[r][c]
    return result
  }

  function collides(shape, ox, oy) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const nx = ox + c
          const ny = oy + r
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true
          if (ny >= 0 && board[ny][nx]) return true
        }
    return false
  }

  function ghostY() {
    let gy = currentPiece.y
    while (!collides(currentPiece.shape, currentPiece.x, gy + 1)) gy++
    return gy
  }

  // ── Logika gry ────────────────────────────────────
  function spawnPiece() {
    const type  = nextType.value
    nextType.value = randomType()
    const shape = cloneShape(SHAPES[type])
    currentPiece = {
      type, shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0
    }
    if (collides(currentPiece.shape, currentPiece.x, currentPiece.y)) {
      gameOver.value = true
      clearInterval(dropTimer)
    }
  }

  function lockPiece() {
    const { shape, x, y, type } = currentPiece
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c] && y + r >= 0)
          board[y + r][x + c] = type
    clearLines()
    spawnPiece()
  }

  function clearLines() {
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== null)) {
        board.splice(r, 1)
        board.unshift(Array(COLS).fill(null))
        cleared++
        r++ // sprawdź ten sam indeks jeszcze raz
      }
    }
    if (cleared > 0) {
      lines.value  += cleared
      score.value  += (SCORE_TABLE[cleared] ?? cleared * 200) * level.value
      level.value   = Math.floor(lines.value / 10) + 1
      restartLoop()
    }
  }

  function tick() {
    if (gameOver.value) return
    if (!collides(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      currentPiece.y++
    } else {
      lockPiece()
    }
  }

  function restartLoop() {
    clearInterval(dropTimer)
    const interval = Math.max(100, 800 - (level.value - 1) * 70)
    dropTimer = setInterval(tick, interval)
  }

  // ── Akcje sterowania ──────────────────────────────
  function moveLeft() {
    if (!gameOver.value && !collides(currentPiece.shape, currentPiece.x - 1, currentPiece.y))
      currentPiece.x--
  }

  function moveRight() {
    if (!gameOver.value && !collides(currentPiece.shape, currentPiece.x + 1, currentPiece.y))
      currentPiece.x++
  }

  function softDrop() {
    if (gameOver.value) return
    if (!collides(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      currentPiece.y++
      score.value++
    } else {
      lockPiece()
    }
  }

  function doRotate() {
    if (gameOver.value) return
    const rotated = rotate(currentPiece.shape)
    for (const offset of [0, -1, 1, -2, 2]) {
      if (!collides(rotated, currentPiece.x + offset, currentPiece.y)) {
        currentPiece.shape  = rotated
        currentPiece.x     += offset
        return
      }
    }
  }

  function hardDrop() {
    if (gameOver.value) return
    const gy = ghostY()
    score.value += (gy - currentPiece.y) * 2
    currentPiece.y = gy
    lockPiece()
  }

  // ── Init / Restart ────────────────────────────────
  function initGame() {
    board          = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    score.value    = 0
    level.value    = 1
    lines.value    = 0
    gameOver.value = false
    nextType.value = randomType()
    spawnPiece()
    restartLoop()
  }

  // ── Dostęp do stanu wewnętrznego (dla canvas) ─────
  function getBoardState() {
    return {
      board,
      currentPiece,
      ghostY: currentPiece ? ghostY() : null
    }
  }

  // Cleanup przy odmontowaniu komponentu
  onUnmounted(() => clearInterval(dropTimer))

  return {
    // Reaktywne (dla templatów)
    score, level, lines, gameOver, nextType,
    // Metody sterowania
    moveLeft, moveRight, softDrop, doRotate, hardDrop, initGame,
    // Dostęp do planszy dla canvas
    getBoardState
  }
}
