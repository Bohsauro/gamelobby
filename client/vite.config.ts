import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SERVER_PORT = Number(process.env.PORT || 4200)

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/ws': {
        target: `ws://localhost:${SERVER_PORT}`,
        ws: true,
      },
    },
  },
})