import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const socketTarget = env.VITE_SOCKET_IO_TARGET || 'http://localhost:3000'

  return {
    plugins: [vue()],
    server: {
      host: true,
      // W trybie dev Vite proxy Socket.io do serwera Express
      proxy: {
        '/socket.io': {
          target: socketTarget,
          ws: true
        }
      }
    }
  }
})
