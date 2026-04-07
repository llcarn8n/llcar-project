import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/static/spa/',
  server: {
    proxy: {
      '/api': 'https://llcar.ru'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static'
  }
})
