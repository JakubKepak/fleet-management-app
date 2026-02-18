import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://a1.gpsguard.eu',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
