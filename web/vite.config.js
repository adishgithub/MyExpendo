import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname),   // keep vite.config.js inside web/
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api calls to your Express backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})