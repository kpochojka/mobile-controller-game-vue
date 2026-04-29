<template>
  <div class="qr-wrapper">
    <div class="qr-box">
      <img v-if="dataUrl" :src="dataUrl" width="180" height="180" alt="QR kod" />
      <div v-else class="qr-placeholder">Generowanie QR…</div>
    </div>
    <p class="qr-label">
      Zeskanuj QR kodem<br>
      <span>↑ Steruj przez telefon</span>
    </p>
    <div class="ctrl-count">
      <span class="num">{{ controllerCount }}</span>
      kontrolerów
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  controllerCount: { type: Number, default: 0 },
  url: { type: String, default: null }
})

const dataUrl = ref('')

function controllerPageUrl() {
  if (props.url) return props.url
  const fromEnv = import.meta.env.VITE_CONTROLLER_ORIGIN
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return `${fromEnv.replace(/\/$/, '')}/controller`
  }
  return `${window.location.origin}/controller`
}

onMounted(async () => {
  const url = controllerPageUrl()
  dataUrl.value = await QRCode.toDataURL(url, {
    width: 180,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  })
})
</script>

<style scoped>
.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 210px;
}

.qr-box {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 0 28px rgba(0, 200, 255, 0.28);
}

.qr-placeholder {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
}

.qr-label {
  text-align: center;
  font-size: 13px;
  color: #888;
  line-height: 1.6;
}

.qr-label span {
  color: #00d4ff;
  font-weight: 700;
}

.ctrl-count {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 10px 22px;
  text-align: center;
  font-size: 13px;
  color: #888;
}

.num {
  display: block;
  font-size: 30px;
  font-weight: 800;
  color: #00d4ff;
}
</style>
