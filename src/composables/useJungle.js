import { ref } from 'vue'
import socket from '../socket.js'
import {
  JUNGLE_CANVAS_W as CANVAS_W,
  JUNGLE_CANVAS_H as CANVAS_H,
  JUNGLE_BIRD_SIZE as BIRD_SIZE,
  JUNGLE_FOOD_SIZE as FOOD_SIZE,
  JUNGLE_SLOTH_SIZE as SLOTH_SIZE,
  JUNGLE_MONKEY_SIZE as MONKEY_SIZE
} from '../constants/jungleGame.js'

const BIRD_SPEED = 3
const SLOTH_SPEED = 0.75
/** Monkeys move faster than sloth, still slower than birds. */
const MONKEY_SPEED = 1.95
const WAYPOINT_ARRIVED = 45
const FOOD_COUNT = 18
const ROUND_DURATION = 120

const FOOD_POOL = ['🍌','🥭','🍍','🍓','🫐','🍇','🍒','🌺','🪲','🥝']

function hypot(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy)
}

function pickWaypoint(pad) {
  return {
    tx: pad + Math.random() * (CANVAS_W - pad * 2),
    ty: pad + Math.random() * (CANVAS_H - pad * 2)
  }
}

export function useJungle() {
  let players = new Map()
  let foods = []
  let sloth = { x: 0, y: 0, tx: 0, ty: 0 }
  /** Two independent fruit-stealing monkeys. */
  let monkeys = []
  let rafId = null
  let timerInterval = null
  let loopActive = false

  const timeLeft   = ref(ROUND_DURATION)
  const gameActive = ref(false)
  const gameEnded  = ref(false)
  const myScore    = ref(0)
  const playerList = ref([])

  function syncPlayerList() {
    playerList.value = [...players.values()].map(p => ({
      id: p.id, name: p.name, bird: p.bird, score: p.score
    }))
  }

  function spawnFood() {
    const pad = FOOD_SIZE
    foods.push({
      id: String(Math.random()),
      emoji: FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)],
      x: pad + Math.random() * (CANVAS_W - pad * 2),
      y: pad + Math.random() * (CANVAS_H - pad * 2),
      collected: false
    })
  }

  function resetSloth() {
    sloth.x = CANVAS_W * (0.35 + Math.random() * 0.3)
    sloth.y = CANVAS_H * (0.3 + Math.random() * 0.35)
    const wp = pickWaypoint(SLOTH_SIZE / 2 + 12)
    sloth.tx = wp.tx
    sloth.ty = wp.ty
  }

  function resetMonkeys() {
    const pads = MONKEY_SIZE / 2 + 10
    const spots = [
      { xf: 0.12 + Math.random() * 0.08, yf: 0.14 + Math.random() * 0.1 },
      { xf: 0.78 + Math.random() * 0.08, yf: 0.62 + Math.random() * 0.1 }
    ]
    monkeys = spots.map((s, idx) => {
      const wp = pickWaypoint(pads)
      return {
        id: idx,
        x: s.xf * CANVAS_W,
        y: s.yf * CANVAS_H,
        tx: wp.tx,
        ty: wp.ty
      }
    })
  }

  function updateWaypointCritter(ent, speed, bodyRadius) {
    const margin = bodyRadius + 10
    let dx = ent.tx - ent.x
    let dy = ent.ty - ent.y
    let dist = hypot(dx, dy)

    if (dist < WAYPOINT_ARRIVED) {
      const wp = pickWaypoint(margin)
      ent.tx = wp.tx
      ent.ty = wp.ty
      dx = ent.tx - ent.x
      dy = ent.ty - ent.y
      dist = hypot(dx, dy) || 1
    }

    const step = Math.min(speed, dist)
    ent.x += (dx / dist) * step
    ent.y += (dy / dist) * step

    ent.x = Math.max(bodyRadius, Math.min(CANVAS_W - bodyRadius, ent.x))
    ent.y = Math.max(bodyRadius, Math.min(CANVAS_H - bodyRadius, ent.y))
  }

  function critterEatFruits(cx, cy, radius) {
    const thresh = radius + FOOD_SIZE / 2
    for (let i = foods.length - 1; i >= 0; i--) {
      const food = foods[i]
      if (hypot(cx - food.x, cy - food.y) < thresh) {
        foods.splice(i, 1)
        spawnFood()
      }
    }
  }

  /** Push bird outside combined radius with obstacle at (cx, cy). */
  function resolveBirdObstacle(player, cx, cy, obstacleRadius) {
    const rBird = BIRD_SIZE / 2
    let dx = player.x - cx
    let dy = player.y - cy
    let dist = hypot(dx, dy)
    const minD = rBird + obstacleRadius
    if (dist >= minD) return
    if (dist < 1e-6) {
      dx = Math.random() - 0.5
      dy = Math.random() - 0.5
      dist = hypot(dx, dy) || 1
    }
    const nx = dx / dist
    const ny = dy / dist
    player.x = cx + nx * minD
    player.y = cy + ny * minD
    player.x = Math.max(rBird, Math.min(CANVAS_W - rBird, player.x))
    player.y = Math.max(rBird, Math.min(CANVAS_H - rBird, player.y))
  }

  /**
   * Overlap with a monkey wipes score to 0. One wipe per overlap episode until the bird separates.
   */
  function applyMonkeyTouchPenalty(player) {
    const hitR = MONKEY_SIZE / 2 + BIRD_SIZE / 2
    const touchingMonkey = monkeys.some(
      (m) => hypot(player.x - m.x, player.y - m.y) <= hitR + 1e-4
    )
    if (touchingMonkey) {
      if (!player._monkeyContact) {
        player._monkeyContact = true
        if (player.score > 0) {
          player.score = 0
          syncPlayerList()
          socket.emit('jungle-score-update', { playerId: player.id, score: player.score })
        }
      }
    } else {
      player._monkeyContact = false
    }
  }

  function gameLoop() {
    if (!loopActive) return

    const padSloth = SLOTH_SIZE / 2
    const radiusMonkey = MONKEY_SIZE / 2

    updateWaypointCritter(sloth, SLOTH_SPEED, padSloth)
    critterEatFruits(sloth.x, sloth.y, SLOTH_SIZE / 2)

    for (const m of monkeys) {
      updateWaypointCritter(m, MONKEY_SPEED, radiusMonkey)
      critterEatFruits(m.x, m.y, MONKEY_SIZE / 2)
    }

    for (const player of players.values()) {
      player.x = Math.max(BIRD_SIZE / 2, Math.min(CANVAS_W - BIRD_SIZE / 2, player.x + player.vx))
      player.y = Math.max(BIRD_SIZE / 2, Math.min(CANVAS_H - BIRD_SIZE / 2, player.y + player.vy))

      const threshold = BIRD_SIZE / 2 + FOOD_SIZE / 2
      for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i]
        const dx = player.x - food.x
        const dy = player.y - food.y
        if (hypot(dx, dy) < threshold) {
          foods.splice(i, 1)
          player.score++
          syncPlayerList()
          socket.emit('jungle-score-update', { playerId: player.id, score: player.score })
          spawnFood()
        }
      }

      applyMonkeyTouchPenalty(player)

      resolveBirdObstacle(player, sloth.x, sloth.y, SLOTH_SIZE / 2)
      for (const m of monkeys) {
        resolveBirdObstacle(player, m.x, m.y, MONKEY_SIZE / 2)
      }
    }

    rafId = requestAnimationFrame(gameLoop)
  }

  function initGame() {
    players = new Map()
    foods = []
    resetSloth()
    resetMonkeys()
    timeLeft.value = ROUND_DURATION
    gameActive.value = true
    gameEnded.value = false
    syncPlayerList()

    for (let i = 0; i < FOOD_COUNT; i++) spawnFood()

    loopActive = true
    rafId = requestAnimationFrame(gameLoop)

    timerInterval = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        loopActive = false
        gameActive.value = false
        gameEnded.value = true
        clearInterval(timerInterval)
        if (rafId) cancelAnimationFrame(rafId)
        socket.emit('jungle-game-end')
      }
    }, 1000)
  }

  function addPlayer(playerData) {
    players.set(playerData.id, {
      ...playerData,
      x: 120 + Math.random() * (CANVAS_W - 240),
      y: 120 + Math.random() * (CANVAS_H - 240),
      vx: 0,
      vy: 0,
      _monkeyContact: false
    })
    syncPlayerList()
  }

  function removePlayer(playerId) {
    players.delete(playerId)
    syncPlayerList()
  }

  function applyControl(playerId, action) {
    const player = players.get(playerId)
    if (!player) return
    if (action === 'left')   player.vx = -BIRD_SPEED
    if (action === 'right')  player.vx =  BIRD_SPEED
    if (action === 'up')     player.vy = -BIRD_SPEED
    if (action === 'down')   player.vy =  BIRD_SPEED
    if (action === 'stop-x') player.vx = 0
    if (action === 'stop-y') player.vy = 0
  }

  function applyScoreUpdate(playerId, score) {
    const player = players.get(playerId)
    if (player) {
      player.score = score
      syncPlayerList()
    }
  }

  function getBoardState() {
    return { players, foods, sloth, monkeys }
  }

  function cleanup() {
    loopActive = false
    if (rafId) cancelAnimationFrame(rafId)
    if (timerInterval) clearInterval(timerInterval)
  }

  return {
    timeLeft, gameActive, gameEnded, myScore, playerList,
    initGame, addPlayer, removePlayer, applyControl, applyScoreUpdate,
    getBoardState, cleanup
  }
}
