import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/static/spa-v3/',
  server: {
    proxy: {
      '/api': 'https://llcar.ru'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('node_modules/@react-three/fiber')) return 'three-fiber'
          if (id.includes('node_modules/@react-three/drei')) return 'three-drei'
          if (id.includes('node_modules/@react-three/postprocessing')) return 'three-postprocessing'
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'echarts'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'leaflet'
          if (id.includes('node_modules/react-dom/')) return 'react-dom'
        },
      },
    },
  }
})
