<template>
  <div class="qr-wrapper" :class="'theme-' + theme">
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
import { ref, onMounted, watch, computed } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  controllerCount: { type: Number, default: 0 },
  url: { type: String, default: null },
  /** UI chrome: Tetris (cyan) or Jungle (emerald). */
  theme: {
    type: String,
    default: 'tetris',
    validator: (v) => ['tetris', 'jungle'].includes(v)
  }
})

const dataUrl = ref('')

const altText = computed(() =>
  props.theme === 'jungle' ? 'QR code to join as controller' : 'QR kod'
)

const placeholderText = computed(() =>
  props.theme === 'jungle' ? 'Creating QR…' : 'Generowanie QR…'
)

const labelHtml = computed(() => {
  if (props.theme === 'jungle') {
    return 'Scan with your phone<br><span>Fly with the D-pad</span>'
  }
  return 'Zeskanuj QR kodem<br><span>↑ Steruj przez telefon</span>'
})

const countLabel = computed(() =>
  props.theme === 'jungle' ? 'players joined' : 'kontrolerów'
)

function controllerPageUrl() {
  if (props.url) return props.url
  const fromEnv = import.meta.env.VITE_CONTROLLER_ORIGIN
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return `${fromEnv.replace(/\/$/, '')}/controller`
  }
  return `${window.location.origin}/controller`
}

async function makeQr() {
  const url = controllerPageUrl()
  const jungle = props.theme === 'jungle'
  dataUrl.value = await QRCode.toDataURL(url, {
    width: 180,
    margin: 1,
    color: jungle
      ? { dark: '#0a2918', light: '#f0fdf4' }
      : { dark: '#000000', light: '#ffffff' }
  })
}

onMounted(() => makeQr())

watch(
  () => [props.url, props.theme],
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
  min-width: 210px;
  font-family: 'Outfit', system-ui, sans-serif;
}

.qr-box {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 0 28px rgba(0, 200, 255, 0.28);
}

.theme-jungle .qr-box {
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(180deg, #f7fef9 0%, #ecfdf3 100%);
  box-shadow:
    0 0 32px rgba(60, 200, 120, 0.25),
    0 16px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(100, 200, 130, 0.35);
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

.qr-label :deep(span) {
  color: #00d4ff;
  font-weight: 700;
}

.theme-jungle .qr-label {
  color: rgba(180, 220, 190, 0.75);
  font-weight: 500;
}

.theme-jungle .qr-label :deep(span) {
  color: #86efac;
}

.ctrl-count {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 22px;
  text-align: center;
  font-size: 13px;
  color: #888;
}

.theme-jungle .ctrl-count {
  background: rgba(12, 40, 28, 0.55);
  border-color: rgba(100, 200, 140, 0.2);
  color: rgba(200, 230, 200, 0.65);
}

.num {
  display: block;
  font-size: 30px;
  font-weight: 800;
  color: #00d4ff;
}

.theme-jungle .num {
  color: #fde68a;
}
</style>
