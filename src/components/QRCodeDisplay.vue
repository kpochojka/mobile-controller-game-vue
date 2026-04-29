<template>
  <div class="qr-wrapper">
    <div class="qr-box">
      <img v-if="dataUrl" :src="dataUrl" width="180" height="180" :alt="altText" />
      <div v-else class="qr-placeholder">{{ placeholderText }}</div>
    </div>
    <p class="qr-label" v-html="labelHtml" />
    <div class="ctrl-count">
      <span class="num">{{ controllerCount }}</span>
      {{ countLabel }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  controllerCount: { type: Number, default: 0 },
  url: { type: String, default: null }
})

const dataUrl = ref('')

const altText = 'QR code to join as controller'
const placeholderText = 'Creating QR…'
const labelHtml =
  'Scan with your phone<br><span>Fly with the D-pad</span>'
const countLabel = 'players joined'

function controllerPageUrl() {
  if (props.url) return props.url
  const fromEnv = import.meta.env.VITE_CONTROLLER_ORIGIN
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return `${fromEnv.replace(/\/$/, '')}/jungle-controller`
  }
  return `${window.location.origin}/jungle-controller`
}

async function makeQr() {
  const url = controllerPageUrl()
  dataUrl.value = await QRCode.toDataURL(url, {
    width: 180,
    margin: 1,
    color: { dark: '#0a2918', light: '#f0fdf4' }
  })
}

onMounted(() => makeQr())

watch(
  () => [props.url],
  () => {
    makeQr()
  }
)
</script>

<style scoped>
.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-sizing: border-box;
  min-width: 0;
  max-width: min(210px, 100%);
  font-family: 'Outfit', system-ui, sans-serif;
}

.qr-box {
  border-radius: 18px;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 210px;
  background: linear-gradient(180deg, #f7fef9 0%, #ecfdf3 100%);
  box-shadow:
    0 0 32px rgba(60, 200, 120, 0.25),
    0 16px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(100, 200, 130, 0.35);
}

.qr-placeholder {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1;
  min-height: 136px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
}

.qr-box img {
  display: block;
  width: 100%;
  max-width: 180px;
  height: auto;
  vertical-align: top;
}

.qr-label {
  text-align: center;
  font-size: 13px;
  color: rgba(180, 220, 190, 0.75);
  line-height: 1.6;
  font-weight: 500;
}

.qr-label :deep(span) {
  color: #86efac;
  font-weight: 700;
}

.ctrl-count {
  background: rgba(12, 40, 28, 0.55);
  border: 1px solid rgba(100, 200, 140, 0.2);
  border-radius: 12px;
  padding: 10px 22px;
  text-align: center;
  font-size: 13px;
  color: rgba(200, 230, 200, 0.65);
}

.num {
  display: block;
  font-size: 30px;
  font-weight: 800;
  color: #fde68a;
}
</style>
