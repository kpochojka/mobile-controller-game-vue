<template>
  <div class="controller-screen">

    <!-- Pasek statusu -->
    <div class="status-bar">
      <span class="dot" :class="{ connected }" />
      <span class="status-text">{{ statusMsg }}</span>
    </div>

    <!-- Przyciski -->
    <div class="pad">

      <!-- Obrót -->
      <div class="row row-top">
        <button class="btn btn-rotate" @touchstart.prevent="send('rotate')" @mousedown="send('rotate')">↻</button>
        <span class="label">Obrót</span>
      </div>

      <!-- Lewo / Hard Drop / Prawo -->
      <div class="row row-mid">
        <div class="btn-wrap">
          <button
            class="btn btn-move"
            @touchstart.prevent="startRepeat('left')"
            @touchend.prevent="stopRepeat"
            @mousedown="startRepeat('left')"
            @mouseup="stopRepeat"
          >◀</button>
          <span class="label">Lewo</span>
        </div>

        <div class="btn-wrap">
          <button class="btn btn-drop" @touchstart.prevent="send('drop')" @mousedown="send('drop')">⬇</button>
          <span class="label">Drop</span>
        </div>

        <div class="btn-wrap">
          <button
            class="btn btn-move"
            @touchstart.prevent="startRepeat('right')"
            @touchend.prevent="stopRepeat"
            @mousedown="startRepeat('right')"
            @mouseup="stopRepeat"
          >▶</button>
          <span class="label">Prawo</span>
        </div>
      </div>

      <!-- Powolny drop + Start -->
      <div class="row row-bot">
        <div class="btn-wrap">
          <button
            class="btn btn-soft"
            @touchstart.prevent="startRepeat('down')"
            @touchend.prevent="stopRepeat"
            @mousedown="startRepeat('down')"
            @mouseup="stopRepeat"
          >▼</button>
          <span class="label">Powoli</span>
        </div>
        <div class="btn-wrap">
          <button class="btn btn-start" @touchstart.prevent="send('start')" @mousedown="send('start')">▶/↺</button>
          <span class="label">Start</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import socket from '../socket.js'

const connected  = ref(false)
const statusMsg  = ref('Łączenie…')

let repeatTimer = null
let repeatFast  = null

function send(action) {
  socket.emit('control', { action })
  if (navigator.vibrate) navigator.vibrate(28)
}

function startRepeat(action) {
  send(action)
  clearTimeout(repeatTimer)
  clearInterval(repeatFast)
  repeatTimer = setTimeout(() => {
    repeatFast = setInterval(() => send(action), 80)
  }, 280)
}

function stopRepeat() {
  clearTimeout(repeatTimer)
  clearInterval(repeatFast)
}

onMounted(() => {
  socket.emit('register-controller')

  socket.on('controller-ready', () => {
    connected.value = true
    statusMsg.value = 'Połączono z grą ✓'
  })

  socket.on('disconnect', () => {
    connected.value = false
    statusMsg.value = 'Rozłączono — odśwież stronę'
  })

  // Blokuj scroll na dotyku
  document.addEventListener('touchstart', e => e.preventDefault(), { passive: false })
})

onUnmounted(() => {
  stopRepeat()
  socket.off('controller-ready')
  socket.off('disconnect')
})
</script>

<style scoped>
* { -webkit-tap-highlight-color: transparent; }

.controller-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

/* Status bar */
.status-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #f44;
  transition: background 0.3s;
}
.dot.connected { background: #4f4; }
.status-text { color: #aaa; }

/* Pad */
.pad {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 16px;
  gap: 10px;
}

.row { display: flex; justify-content: center; align-items: center; gap: 12px; }
.row-top { flex-direction: column; gap: 6px; }
.row-bot { gap: 20px; }

.btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.label {
  font-size: 11px;
  color: #444;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Przyciski */
.btn {
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.08s;
}
.btn:active { transform: scale(0.87); }

.btn-move {
  width: 88px; height: 88px;
  background: linear-gradient(145deg, #1e3a5f, #0d2040);
  box-shadow: 0 6px 18px rgba(0,100,255,0.28);
}

.btn-rotate {
  width: 98px; height: 98px;
  background: linear-gradient(145deg, #5a2080, #3a1060);
  box-shadow: 0 6px 20px rgba(160,0,240,0.38);
  font-size: 34px;
}

.btn-drop {
  width: 108px; height: 108px;
  background: linear-gradient(145deg, #c04000, #802800);
  box-shadow: 0 6px 22px rgba(255,100,0,0.38);
  font-size: 38px;
}

.btn-soft {
  width: 88px; height: 88px;
  background: linear-gradient(145deg, #1a5a1a, #0d3a0d);
  box-shadow: 0 6px 18px rgba(0,200,0,0.28);
}

.btn-start {
  width: 78px; height: 78px;
  background: linear-gradient(145deg, #2a2a2a, #111);
  box-shadow: 0 4px 14px rgba(0,0,0,0.5);
  border-radius: 12px;
  font-size: 18px;
}
</style>
