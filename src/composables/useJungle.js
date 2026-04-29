import { ref } from 'vue'
import socket from '../socket.js'

const CANVAS_W = 900
const CANVAS_H = 600
const BIRD_SPEED = 3
const BIRD_SIZE = 36
const FOOD_SIZE = 28
const FOOD_COUNT = 12
const ROUND_DURATION = 60

const FOOD_POOL = ['🍌','🥭','🍍','🍓','🫐','🍇','🍒','🌺','🪲','🥝']

export function useJungle() {
  let players = new Map()
  let foods = []
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
    foods.push({
      id: String(Math.random()),
      emoji: FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)],
      x: FOOD_SIZE + Math.random() * (CANVAS_W - FOOD_SIZE * 2),
      y: FOOD_SIZE + Math.random() * (CANVAS_H - FOOD_SIZE * 2),
      collected: false
    })
  }

  function gameLoop() {
    if (!loopActive) return

    for (const player of players.values()) {
      player.x = Math.max(BIRD_SIZE / 2, Math.min(CANVAS_W - BIRD_SIZE / 2, player.x + player.vx))
      player.y = Math.max(BIRD_SIZE / 2, Math.min(CANVAS_H - BIRD_SIZE / 2, player.y + player.vy))

      const threshold = BIRD_SIZE / 2 + FOOD_SIZE / 2
      for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i]
        const dx = player.x - food.x
        const dy = player.y - food.y
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          foods.splice(i, 1)
          player.score++
          syncPlayerList()
          socket.emit('jungle-score-update', { playerId: player.id, score: player.score })
          spawnFood()
        }
      }
    }

    rafId = requestAnimationFrame(gameLoop)
  }

  function initGame() {
    players = new Map()
    foods = []
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
      x: 100 + Math.random() * (CANVAS_W - 200),
      y: 100 + Math.random() * (CANVAS_H - 200),
      vx: 0,
      vy: 0
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
    return { players, foods }
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
